import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import { subscribeToAuthState } from "../auth/playerAuth";
import StreakCalendar from "../components/profile/StreakCalendar.tsx";
import StatCard from "../components/profile/StatCard.tsx";
import ProfileHeader from "../components/profile/ProfileHeader.tsx";
import HistorySection from "../components/profile/HistorySection.tsx";
import FavoritesSection from "../components/profile/FavoritesSection.tsx";
import { getUserProfile, type UserProfileView } from "../services/userProfile";

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
    const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState((player) => {
            if (!player) {
                navigate("/login", { replace: true });
                return;
            }

            const loadProfile = async () => {
                const profile = await getUserProfile(player.id, {
                    uid: player.id,
                    username: player.username,
                    email: player.email,
                    provider: "password",
                });

                setProfileData(profile ?? {
                    ...defaultProfileData,
                    uid: player.id,
                    username: player.username,
                    email: player.email,
                    createdAt: player.createdAt ?? Date.now(),
                });
                setLoading(false);
            };

            void loadProfile();
        });

        return unsubscribe;
    }, [navigate]);

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
                <ProfileHeader username={profileData.username} joinedDate={profileData.createdAt} />
                <div className={styles.statGrid}>
                    <StatCard label="Total Quizzes" value={profileData.totalQuizzesPlayed} />
                    <StatCard label="Current Streak" value={profileData.currentStreak} />
                    <StatCard label="Best Streak" value={profileData.bestStreak} />
                    <StatCard label="Avg Score" value={`${profileData.averageScore.toFixed(1)}%`} />
                </div>
            </section>


            <section className={styles.streakSection}>
                <h2 className={styles.sectionTitle}>Contribution Streak</h2>
                <StreakCalendar
                    currentStreak={profileData.currentStreak}
                    bestStreak={profileData.bestStreak}
                    dailyActivityCounts={profileData.dailyActivityCounts}
                />
            </section>

            <HistorySection recentGames={profileData.recentGames} />
            <FavoritesSection favoriteAnime={profileData.favoriteAnime} />

        </div>
    );
}
