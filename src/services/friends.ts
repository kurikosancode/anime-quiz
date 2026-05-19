import {
    collection,
    deleteDoc,
    doc,
    endAt,
    getDoc,
    getDocs,
    limit as limitQuery,
    orderBy,
    query,
    setDoc,
    startAt,
    updateDoc,
    where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/firebaseClient";
import type { UserProfileDocument } from "./userProfile";

const FRIENDSHIPS_COLLECTION = "friendships";

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export type FriendshipDocument = {
    id: string;
    members: [string, string];
    requesterUid: string;
    requesterUsername: string;
    requesterUsernameLower: string;
    addresseeUid: string;
    addresseeUsername: string;
    addresseeUsernameLower: string;
    status: FriendshipStatus;
    createdAt: number;
    updatedAt: number;
    acceptedAt: number | null;
    blockedByUid: string | null;
};

export type PublicUserSearchResult = {
    uid: string;
    username: string;
    usernameLower: string;
    email: string;
    createdAt: number | null;
};

export type FriendMutationResult = {
    ok: boolean;
    message: string;
    friendship?: FriendshipDocument;
};

function normalizeUsername(value: string): string {
    return value.trim().toLowerCase();
}

function friendshipId(firstUid: string, secondUid: string): string {
    return [firstUid, secondUid].sort((first, second) => first.localeCompare(second)).join("__");
}

async function readPublicProfile(uid: string): Promise<PublicUserSearchResult | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
        const snapshot = await getDoc(doc(db, "users", uid));
        if (!snapshot.exists()) return null;

        const data = snapshot.data() as Partial<UserProfileDocument>;

        return {
            uid: data.uid ?? uid,
            username: data.username ?? "Player",
            usernameLower: data.usernameLower ?? normalizeUsername(data.username ?? "Player"),
            email: data.email ?? "",
            createdAt: typeof data.createdAt === "number" ? data.createdAt : null,
        };
    } catch {
        return null;
    }
}

function toFriendshipDocument(id: string, requester: PublicUserSearchResult, addressee: PublicUserSearchResult, status: FriendshipStatus): FriendshipDocument {
    const now = Date.now();

    return {
        id,
        members: [requester.uid, addressee.uid],
        requesterUid: requester.uid,
        requesterUsername: requester.username,
        requesterUsernameLower: requester.usernameLower,
        addresseeUid: addressee.uid,
        addresseeUsername: addressee.username,
        addresseeUsernameLower: addressee.usernameLower,
        status,
        createdAt: now,
        updatedAt: now,
        acceptedAt: status === "accepted" ? now : null,
        blockedByUid: null,
    };
}

export async function searchUsersByUsername(queryText: string, limitCount = 10, excludeUid?: string): Promise<PublicUserSearchResult[]> {
    if (!isFirebaseConfigured || !db) return [];

    const normalizedQuery = normalizeUsername(queryText);
    if (!normalizedQuery) return [];

    try {
        const usersRef = collection(db, "users");
        const searchQuery = query(
            usersRef,
            orderBy("usernameLower"),
            startAt(normalizedQuery),
            endAt(`${normalizedQuery}\uf8ff`),
            limitQuery(limitCount),
        );

        const snapshot = await getDocs(searchQuery);
        return snapshot.docs
            .map((snapshotDoc) => snapshotDoc.data() as Partial<UserProfileDocument>)
            .map((data) => ({
                uid: data.uid ?? "",
                username: data.username ?? "Player",
                usernameLower: data.usernameLower ?? normalizeUsername(data.username ?? "Player"),
                email: data.email ?? "",
                createdAt: typeof data.createdAt === "number" ? data.createdAt : null,
            }))
            .filter((profile) => profile.uid.length > 0)
            .filter((profile) => profile.uid !== excludeUid);
    } catch {
        return [];
    }
}

export async function getFriendshipBetween(firstUid: string, secondUid: string): Promise<FriendshipDocument | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
        const snapshot = await getDoc(doc(db, FRIENDSHIPS_COLLECTION, friendshipId(firstUid, secondUid)));
        if (!snapshot.exists()) return null;
        return snapshot.data() as FriendshipDocument;
    } catch {
        return null;
    }
}

export async function sendFriendRequest(requesterUid: string, addresseeUid: string): Promise<FriendMutationResult> {
    if (!isFirebaseConfigured || !db) {
        return { ok: false, message: "Firebase is not configured." };
    }

    if (!requesterUid || !addresseeUid || requesterUid === addresseeUid) {
        return { ok: false, message: "You cannot add yourself as a friend." };
    }

    const requester = await readPublicProfile(requesterUid);
    const addressee = await readPublicProfile(addresseeUid);

    if (!requester || !addressee) {
        return { ok: false, message: "User not found." };
    }

    const connectionId = friendshipId(requesterUid, addresseeUid);
    const connectionRef = doc(db, FRIENDSHIPS_COLLECTION, connectionId);
    const existingSnapshot = await getDoc(connectionRef);

    if (existingSnapshot.exists()) {
        const existing = existingSnapshot.data() as FriendshipDocument;

        if (existing.status === "accepted") {
            return { ok: false, message: "You are already friends with this user.", friendship: existing };
        }

        if (existing.status === "pending") {
            if (existing.requesterUid === requesterUid) {
                return { ok: false, message: "Friend request already sent.", friendship: existing };
            }

            if (existing.addresseeUid === requesterUid) {
                const accepted: FriendshipDocument = {
                    ...existing,
                    status: "accepted",
                    updatedAt: Date.now(),
                    acceptedAt: Date.now(),
                };

                await updateDoc(connectionRef, {
                    status: accepted.status,
                    updatedAt: accepted.updatedAt,
                    acceptedAt: accepted.acceptedAt,
                });

                return { ok: true, message: "Friend request accepted.", friendship: accepted };
            }
        }

        if (existing.status === "blocked") {
            return { ok: false, message: "This friendship is blocked.", friendship: existing };
        }
    }

    const friendship = toFriendshipDocument(connectionId, requester, addressee, "pending");

    await setDoc(connectionRef, friendship);

    return { ok: true, message: "Friend request sent.", friendship };
}

export async function acceptFriendRequest(currentUserUid: string, otherUserUid: string): Promise<FriendMutationResult> {
    if (!isFirebaseConfigured || !db) {
        return { ok: false, message: "Firebase is not configured." };
    }

    const connectionRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId(currentUserUid, otherUserUid));
    const snapshot = await getDoc(connectionRef);

    if (!snapshot.exists()) {
        return { ok: false, message: "Friend request not found." };
    }

    const existing = snapshot.data() as FriendshipDocument;
    if (existing.status !== "pending") {
        return { ok: false, message: "Friend request is no longer pending.", friendship: existing };
    }

    if (existing.addresseeUid !== currentUserUid) {
        return { ok: false, message: "Only the recipient can accept this request.", friendship: existing };
    }

    const updatedAt = Date.now();
    await updateDoc(connectionRef, {
        status: "accepted",
        updatedAt,
        acceptedAt: updatedAt,
    });

    return {
        ok: true,
        message: "Friend request accepted.",
        friendship: {
            ...existing,
            status: "accepted",
            updatedAt,
            acceptedAt: updatedAt,
        },
    };
}

export async function declineFriendRequest(currentUserUid: string, otherUserUid: string): Promise<FriendMutationResult> {
    if (!isFirebaseConfigured || !db) {
        return { ok: false, message: "Firebase is not configured." };
    }

    const connectionRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId(currentUserUid, otherUserUid));
    const snapshot = await getDoc(connectionRef);

    if (!snapshot.exists()) {
        return { ok: false, message: "Friend request not found." };
    }

    const existing = snapshot.data() as FriendshipDocument;
    if (existing.status !== "pending") {
        return { ok: false, message: "Friend request is no longer pending.", friendship: existing };
    }

    if (existing.addresseeUid !== currentUserUid) {
        return { ok: false, message: "Only the recipient can decline this request.", friendship: existing };
    }

    await deleteDoc(connectionRef);

    return { ok: true, message: "Friend request declined." };
}

export async function removeFriend(firstUid: string, secondUid: string): Promise<FriendMutationResult> {
    if (!isFirebaseConfigured || !db) {
        return { ok: false, message: "Firebase is not configured." };
    }

    const connectionRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId(firstUid, secondUid));
    const snapshot = await getDoc(connectionRef);

    if (!snapshot.exists()) {
        return { ok: false, message: "Friendship not found." };
    }

    const existing = snapshot.data() as FriendshipDocument;
    await deleteDoc(connectionRef);

    return { ok: true, message: existing.status === "accepted" ? "Friend removed." : "Friend request removed." };
}

export async function getAcceptedFriends(uid: string): Promise<FriendshipDocument[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
        const friendshipsRef = collection(db, FRIENDSHIPS_COLLECTION);
        const friendshipsQuery = query(friendshipsRef, where("members", "array-contains", uid));
        const snapshot = await getDocs(friendshipsQuery);

        return snapshot.docs
            .map((snapshotDoc) => snapshotDoc.data() as FriendshipDocument)
            .filter((friendship) => friendship.status === "accepted");
    } catch {
        return [];
    }
}

export async function getPendingRequestsForUser(uid: string): Promise<FriendshipDocument[]> {
    if (!isFirebaseConfigured || !db) return [];

    if (!isFirebaseConfigured) {
        // Helpful during dev: warn when environment is missing
        // callers should handle empty results but logging helps debugging.
        // eslint-disable-next-line no-console
        console.warn("getPendingRequestsForUser: Firebase not configured");
        return [];
    }

    try {
        const friendshipsRef = collection(db, FRIENDSHIPS_COLLECTION);
        const pendingQuery = query(
            friendshipsRef,
            where("addresseeUid", "==", uid),
            where("status", "==", "pending"),
            limitQuery(50),
        );
        const snapshot = await getDocs(pendingQuery);
        return snapshot.docs.map((d) => d.data() as FriendshipDocument);
    } catch {
        // eslint-disable-next-line no-console
        console.error("getPendingRequestsForUser: error fetching pending requests");
        return [];
    }
}