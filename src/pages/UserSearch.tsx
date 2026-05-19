import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import styles from "./UserSearch.module.css";
import paths from "../constants/paths";
import { getFriendshipBetween, searchUsersByUsername, sendFriendRequest, acceptFriendRequest, declineFriendRequest, getPendingRequestsForUser, type FriendshipDocument, type PublicUserSearchResult } from "../services/friends";
import { isFirebaseConfigured } from "../firebase/firebaseClient";
import { subscribeToAuthState } from "../auth/playerAuth";

export default function UserSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PublicUserSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [currentUid, setCurrentUid] = useState<string | null>(null);
    const [friendships, setFriendships] = useState<Record<string, FriendshipDocument | null>>({});
    const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState("");
    const [pending, setPending] = useState<FriendshipDocument[]>([]);
    const [pendingLoading, setPendingLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState((player) => {
            setCurrentUid(player?.id ?? null);
        });

        return unsubscribe;
    }, []);

    const normalizedQuery = useMemo(() => query.trim(), [query]);

    const runSearch = async () => {
        if (!normalizedQuery) {
            setResults([]);
            return;
        }

        setLoading(true);
        setSearching(true);
        const matches = await searchUsersByUsername(normalizedQuery, 20, currentUid ?? undefined);
        setResults(matches);
        setLoading(false);
        setSearching(false);
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void runSearch();
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [normalizedQuery, currentUid]);

    useEffect(() => {
        const loadFriendships = async () => {
            if (!currentUid) {
                setFriendships({});
                return;
            }

            const entries = await Promise.all(
                results.map(async (user) => [user.uid, await getFriendshipBetween(currentUid, user.uid)] as const),
            );

            setFriendships(Object.fromEntries(entries));
        };

        void loadFriendships();
    }, [currentUid, results]);

    const fetchPending = async () => {
        if (!currentUid) {
            setPending([]);
            return;
        }

        setPendingLoading(true);
        const incoming = await getPendingRequestsForUser(currentUid);
        setPending(incoming);
        setPendingLoading(false);
    };

    useEffect(() => {
        void fetchPending();
    }, [currentUid]);

    const refreshFriendship = async (targetUid: string) => {
        if (!currentUid) return;

        const updated = await getFriendshipBetween(currentUid, targetUid);
        setFriendships((previous) => ({ ...previous, [targetUid]: updated }));
    };

    const onFriendAction = async (targetUid: string) => {
        if (!currentUid || actionLoadingUid === targetUid) return;

        setActionLoadingUid(targetUid);
        setActionMessage("");

        const result = await sendFriendRequest(currentUid, targetUid);
        setActionMessage(result.message);
        await refreshFriendship(targetUid);
        setActionLoadingUid(null);
    };

    const onAccept = async (requesterUid: string) => {
        if (!currentUid) return;
        setActionLoadingUid(requesterUid);
        const result = await acceptFriendRequest(currentUid, requesterUid);
        setActionMessage(result.message);
        // refresh pending and friendships
        const incoming = await getPendingRequestsForUser(currentUid);
        setPending(incoming);
        await refreshFriendship(requesterUid);
        setActionLoadingUid(null);
    };

    const onDecline = async (requesterUid: string) => {
        if (!currentUid) return;
        setActionLoadingUid(requesterUid);
        const result = await declineFriendRequest(currentUid, requesterUid);
        setActionMessage(result.message);
        const incoming = await getPendingRequestsForUser(currentUid);
        setPending(incoming);
        setActionLoadingUid(null);
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void runSearch();
    };

    return (
        <div className={styles.page}>
            <section className={styles.card}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Find Users</h1>
                        <p className={styles.subtitle}>Search by username and open any public profile.</p>
                    </div>
                </div>

                <form className={styles.searchRow} onSubmit={onSubmit}>
                    <input
                        className={styles.input}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Type a username"
                        autoComplete="off"
                    />
                    <button className={styles.button} type="submit" disabled={searching}>
                        {searching ? "Searching..." : "Search"}
                    </button>
                </form>

                <p className={styles.status}>
                    {loading ? "Looking up users..." : normalizedQuery ? `${results.length} result${results.length === 1 ? "" : "s"}` : ""}
                </p>

                {normalizedQuery && results.length === 0 && !loading ? (
                    <div className={styles.empty}>No users matched that search.</div>
                ) : (
                    <div className={styles.results}>
                        {results.map((user) => {
                            const friendship = friendships[user.uid] ?? null;
                            const isSelf = user.uid === currentUid;
                            const friendLabel = friendship?.status === "accepted"
                                ? "Friends"
                                : friendship?.status === "pending" && friendship.requesterUid === currentUid
                                    ? "Pending"
                                    : friendship?.status === "pending" && friendship.addresseeUid === currentUid
                                        ? "Accept"
                                        : "Add Friend";
                            const friendDisabled = !currentUid || isSelf || friendship?.status === "accepted" || (friendship?.status === "pending" && friendship.requesterUid === currentUid);
                            const friendButtonClass = friendship?.status === "pending" && friendship.requesterUid === currentUid
                                ? styles.friendButtonPending
                                : friendship?.status === "accepted"
                                    ? styles.friendButtonFriends
                                    : styles.friendButton;

                            return (
                                <div key={user.uid} className={styles.resultCard}>
                                    <Link to={paths.profileUser(user.uid)} className={styles.profileLink}>
                                        <div className={styles.userInfo}>
                                            <div className={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
                                            <div className={styles.nameBlock}>
                                                <span className={styles.username}>{user.username}</span>
                                                <span className={styles.meta}>{user.email || "No public email"}</span>
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        className={friendButtonClass}
                                        type="button"
                                        onClick={() => void onFriendAction(user.uid)}
                                        disabled={friendDisabled || actionLoadingUid === user.uid}
                                    >
                                        {actionLoadingUid === user.uid ? "Working..." : friendLabel}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className={styles.pendingSection}>
                <div className={styles.card}>
                    <p className={styles.cardLabel}>Pending requests</p>
                    {!isFirebaseConfigured ? (
                        <p className={styles.status}>Firebase not configured — pending requests unavailable.</p>
                    ) : pendingLoading ? <p className={styles.status}>Loading requests...</p> : (
                        pending.length === 0 ? (
                            <div className={styles.empty}>No pending requests.</div>
                        ) : (
                            <div className={styles.pendingList}>
                                {pending.map((req) => (
                                    <div key={req.id} className={styles.pendingCard}>
                                        <Link to={paths.profileUser(req.requesterUid)} className={styles.profileLink}>
                                            <div className={styles.userInfo}>
                                                <div className={styles.avatar}>{req.requesterUsername.charAt(0).toUpperCase()}</div>
                                                <div className={styles.nameBlock}>
                                                    <span className={styles.username}>{req.requesterUsername}</span>
                                                </div>
                                            </div>
                                        </Link>
                                        <div className={styles.pendingActions}>
                                            <button className={styles.acceptButton} onClick={() => void onAccept(req.requesterUid)} disabled={actionLoadingUid === req.requesterUid}>
                                                {actionLoadingUid === req.requesterUid ? "Working..." : "Accept"}
                                            </button>
                                            <button className={styles.declineButton} onClick={() => void onDecline(req.requesterUid)} disabled={actionLoadingUid === req.requesterUid}>
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </section>
        </div>
    );
}