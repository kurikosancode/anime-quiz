import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Profile.module.css";
import { subscribeToAuthState } from "../auth/playerAuth";
import StreakCalendar from "../components/profile/StreakCalendar.tsx";
import StatCard from "../components/profile/StatCard.tsx";
import ProfileHeader from "../components/profile/ProfileHeader.tsx";
import HistorySection from "../components/profile/HistorySection.tsx";
import FavoritesSection from "../components/profile/FavoritesSection.tsx";
import { findUserProfileByUsername, getUserProfile, type UserProfileView } from "../services/userProfile";
import { getFriendshipBetween, sendFriendRequest, getAcceptedFriends, removeFriend, type FriendshipDocument } from "../services/friends";
import { Link } from "react-router-dom";
import paths from "../constants/paths";

export type ProfileData = UserProfileView;

const defaultProfileData: ProfileData = {
    uid: "",
    username: "",
    usernameLower: "",
    email: "",
    provider: "password",
    createdAt: 0,
    totalQuizzesPlayed: 0,
    totalQuestionsAttempted: 0,
    totalCorrectAnswers: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedAt: null,
    recentGames: [],
    favoriteAnime: [],
    activityDays: [],
    dailyActivityCounts: {},
    averageScore: 0,
};

export default function Profile() {
    const navigate = useNavigate();
    const { uid } = useParams();
    const [viewerId, setViewerId] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData);
    const [loading, setLoading] = useState(true);
    const [friendship, setFriendship] = useState<FriendshipDocument | null>(null);
    const [friendActionLoading, setFriendActionLoading] = useState(false);
    const [friendActionMessage, setFriendActionMessage] = useState("");
    const [friends, setFriends] = useState<FriendshipDocument[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendDropdownOpen, setFriendDropdownOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState((player) => {
            setViewerId(player?.id ?? null);

            if (!uid && !player) {
                navigate("/login", { replace: true });
                return;
            }

            const loadProfile = async () => {
                const profile = uid
                    ? await getUserProfile(uid)
                    : await getUserProfile(player!.id, {
                        uid: player!.id,
                        username: player!.username,
                        email: player!.email,
                        provider: "password",
                    });

                if (uid && !profile) {
                    const fallbackByUsername = await findUserProfileByUsername(uid);
                    if (fallbackByUsername) {
                        setProfileData(fallbackByUsername);
                        setLoading(false);
                        return;
                    }
                }

                setProfileData(profile ?? {
                    ...defaultProfileData,
                    uid: uid ?? player!.id,
                    username: uid ? "Unknown User" : player!.username,
                    email: uid ? "" : player!.email,
                    createdAt: player?.createdAt ?? Date.now(),
                });
                setLoading(false);
            };

            void loadProfile();
        });

        return unsubscribe;
    }, [navigate, uid]);

    useEffect(() => {
        const loadFriendship = async () => {
            if (!uid || !viewerId || viewerId === profileData.uid) {
                setFriendship(null);
                return;
            }

            const relation = await getFriendshipBetween(viewerId, profileData.uid);
            setFriendship(relation);
        };

        void loadFriendship();
    }, [profileData.uid, uid, viewerId]);

    useEffect(() => {
        const loadFriends = async () => {
            if (!profileData.uid) return;
            setFriendsLoading(true);
            const accepted = await getAcceptedFriends(profileData.uid);
            setFriends(accepted);
            setFriendsLoading(false);
        };

        void loadFriends();
    }, [profileData.uid]);

    const isOwnProfile = !uid || profileData.uid === viewerId;

    const handleFriendAction = async () => {
        if (!viewerId || !profileData.uid || friendActionLoading || isOwnProfile) return;

        setFriendActionLoading(true);
        setFriendActionMessage("");

        const result = await sendFriendRequest(viewerId, profileData.uid);
        setFriendActionMessage(result.message);

        const updatedFriendship = await getFriendshipBetween(viewerId, profileData.uid);
        setFriendship(updatedFriendship);
        setFriendActionLoading(false);
    };

    const friendshipLabel = friendship?.status === "accepted"
        ? "Friends"
        : friendship?.status === "pending" && friendship.requesterUid === viewerId
            ? "Pending Request"
            : friendship?.status === "pending" && friendship.addresseeUid === viewerId
                ? "Accept Friend Request"
                : "Add Friend";

    const friendButtonClass = friendship?.status === "pending" && friendship.requesterUid === viewerId
        ? styles.friendButtonPending
        : friendship?.status === "accepted"
            ? styles.friendButtonFriends
            : styles.friendButton;

    const friendButtonDisabled = friendActionLoading || isOwnProfile || (friendship?.status === "pending" && friendship.requesterUid === viewerId);

    const handleUnfriend = async () => {
        if (!viewerId || !profileData.uid || friendActionLoading) return;

        setFriendActionLoading(true);
        const result = await removeFriend(viewerId, profileData.uid);
        setFriendActionMessage(result.message);

        const updatedFriendship = await getFriendshipBetween(viewerId, profileData.uid);
        setFriendship(updatedFriendship);
        setFriendActionLoading(false);
        setFriendDropdownOpen(false);
    };

    if (loading) {
        return (
            <div className={`${styles.profilePage} ${styles.loadingState}`}>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className={styles.profilePage}>
            <section className={styles.statsSection}>
                <ProfileHeader
                    username={profileData.username}
                    joinedDate={profileData.createdAt}
                    action={!isOwnProfile ? (
                        <div className={styles.friendActionContainer}>
                            <button
                                className={friendButtonClass}
                                onClick={() => {
                                    if (friendship?.status === "accepted") {
                                        setFriendDropdownOpen(!friendDropdownOpen);
                                    } else {
                                        handleFriendAction();
                                    }
                                }}
                                disabled={friendButtonDisabled}
                                type="button"
                            >
                                {friendActionLoading ? "Working..." : friendshipLabel}
                            </button>
                            {friendship?.status === "accepted" && friendDropdownOpen && (
                                <div className={styles.friendDropdown}>
                                    <button
                                        className={styles.unfriendOption}
                                        onClick={handleUnfriend}
                                        disabled={friendActionLoading}
                                        type="button"
                                    >
                                        {friendActionLoading ? "Working..." : "Unfriend"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : undefined}
                />
                {!isOwnProfile && friendActionMessage && <p className={styles.friendMessage}>{friendActionMessage}</p>}
                <div className={styles.statGrid}>
                    <StatCard label="Total Quizzes" value={profileData.totalQuizzesPlayed} />
                    <StatCard label="Current Streak" value={profileData.currentStreak} />
                    <StatCard label="Best Streak" value={profileData.bestStreak} />
                    <StatCard label="Avg Score" value={`${profileData.averageScore.toFixed(1)}%`} />
                </div>
            </section>


            <section className={styles.streakSection}>
                <h2 className={styles.sectionTitle}>Quiz Streak</h2>
                <StreakCalendar
                    currentStreak={profileData.currentStreak}
                    bestStreak={profileData.bestStreak}
                    dailyActivityCounts={profileData.dailyActivityCounts}
                />
            </section>

            <HistorySection recentGames={profileData.recentGames} />
            <FavoritesSection favoriteAnime={profileData.favoriteAnime} />

            <section className={styles.friendsSection}>
                <h2 className={styles.sectionTitle}>Friends ({friends.length})</h2>
                {friendsLoading ? (
                    <p className={styles.friendsStatus}>Loading friends...</p>
                ) : friends.length === 0 ? (
                    <p className={styles.friendsStatus}>No friends yet.</p>
                ) : (
                    <div className={styles.friendsList}>
                        {friends.map((friendship) => {
                            const otherUid = friendship.members[0] === profileData.uid ? friendship.members[1] : friendship.members[0];
                            const otherUsername = friendship.members[0] === profileData.uid ? friendship.addresseeUsername : friendship.requesterUsername;

                            return (
                                <Link key={otherUid} to={paths.profileUser(otherUid)} className={styles.friendCard}>
                                    <div className={styles.friendAvatar}>{otherUsername.charAt(0).toUpperCase()}</div>
                                    <span className={styles.friendName}>{otherUsername}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
