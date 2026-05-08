import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    type User,
} from "firebase/auth";
import {
    collection,
    getDocs,
    limit,
    query,
    where,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase/firebaseClient";
import { seedUserProfileDocument } from "../services/userProfile";

export type PublicPlayer = {
    id: string;
    username: string;
    email: string;
    createdAt: number | null;
};

type RegisterInput = {
    username: string;
    email: string;
    password: string;
};

type LoginInput = {
    identifier: string;
    password: string;
};

type AuthResult = {
    ok: boolean;
    message: string;
    player?: PublicPlayer;
};

type UserProfileInput = {
    uid: string;
    username: string;
    email: string;
    provider: "password" | "google";
};

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

function notConfiguredResult(): AuthResult {
    return {
        ok: false,
        message: "Firebase is not configured. Add your VITE_FIREBASE_* keys to a .env file.",
    };
}

function fromFirebaseUser(user: User): PublicPlayer {
    return {
        id: user.uid,
        username: user.displayName || user.email?.split("@")[0] || "Player",
        email: user.email || "",
        createdAt: null,
    };
}

async function upsertUserProfile(input: UserProfileInput): Promise<void> {
    await seedUserProfileDocument({
        uid: input.uid,
        username: input.username,
        email: input.email,
        provider: input.provider,
    });
}

function mapAuthError(error: unknown): string {
    const code = typeof error === "object" && error && "code" in error
        ? String((error as { code?: unknown }).code)
        : "unknown";

    if (code === "auth/email-already-in-use") return "Email is already registered.";
    if (code === "auth/invalid-email") return "Invalid email format.";
    if (code === "auth/weak-password") return "Password is too weak.";
    if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        return "Invalid username/email or password.";
    }
    if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";

    return "Authentication failed. Please try again.";
}

async function resolveEmail(identifier: string): Promise<string | null> {
    const trimmed = identifier.trim();
    if (!trimmed) return null;
    if (trimmed.includes("@")) return trimmed;

    if (!db) return null;

    const usersRef = collection(db, "users");
    const playersQuery = query(usersRef, where("usernameLower", "==", normalize(trimmed)), limit(1));
    const snapshot = await getDocs(playersQuery);
    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data() as { email?: string };
    return data.email || null;
}

export async function registerPlayer(input: RegisterInput): Promise<AuthResult> {
    if (!isFirebaseConfigured || !auth || !db) {
        return notConfiguredResult();
    }

    const username = input.username.trim();
    const email = input.email.trim();
    const password = input.password;

    if (!username || !email || !password) {
        return { ok: false, message: "Please fill out all fields." };
    }

    const usersRef = collection(db, "users");
    const playersQuery = query(usersRef, where("usernameLower", "==", normalize(username)), limit(1));
    const existingUsername = await getDocs(playersQuery);
    if (!existingUsername.empty) {
        return { ok: false, message: "Username is already taken." };
    }

    try {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credentials.user, { displayName: username });
        await upsertUserProfile({
            uid: credentials.user.uid,
            username,
            email,
            provider: "password",
        });

        return {
            ok: true,
            message: "Account created successfully.",
            player: {
                ...fromFirebaseUser(credentials.user),
                username,
                email,
                createdAt: Date.now(),
            },
        };
    } catch (error) {
        return { ok: false, message: mapAuthError(error) };
    };
}

export async function loginPlayer(input: LoginInput): Promise<AuthResult> {
    if (!isFirebaseConfigured || !auth || !db) {
        return notConfiguredResult();
    }

    const identifier = input.identifier.trim();
    const password = input.password;

    if (!identifier || !password) {
        return { ok: false, message: "Please fill out all fields." };
    }

    const email = await resolveEmail(identifier);
    if (!email) {
        return { ok: false, message: "Invalid username/email or password." };
    }

    try {
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        return {
            ok: true,
            message: "Logged in successfully.",
            player: fromFirebaseUser(credentials.user),
        };
    } catch (error) {
        return { ok: false, message: mapAuthError(error) };
    }
}

export async function signInWithGoogleProvider(): Promise<AuthResult> {
    if (!isFirebaseConfigured || !auth || !db) {
        return notConfiguredResult();
    }

    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        const credentials = await signInWithPopup(auth, provider);
        const username = credentials.user.displayName || credentials.user.email?.split("@")[0] || "Player";

        await upsertUserProfile({
            uid: credentials.user.uid,
            username,
            email: credentials.user.email || "",
            provider: "google",
        });

        return {
            ok: true,
            message: "Signed in with Google successfully.",
            player: fromFirebaseUser(credentials.user),
        };
    } catch (error) {
        return { ok: false, message: mapAuthError(error) };
    }
}

export function getCurrentPlayer(): PublicPlayer | null {
    if (!isFirebaseConfigured || !auth || !auth.currentUser) {
        return null;
    }

    return fromFirebaseUser(auth.currentUser);
}

export function subscribeToAuthState(onChange: (player: PublicPlayer | null) => void): () => void {
    if (!isFirebaseConfigured || !auth) {
        onChange(null);
        return () => { };
    }

    return onAuthStateChanged(auth, (user) => {
        onChange(user ? fromFirebaseUser(user) : null);
    });
}

export async function logoutPlayer(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
}
