import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Settings.module.css";
import paths from "../constants/paths";
import { subscribeToAuthState } from "../auth/playerAuth";
import { getUserProfile, updateUserSettings, type UserProfileView } from "../services/userProfile";

const defaultProfile: UserProfileView = {
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

export default function Settings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState<UserProfileView>(defaultProfile);
    const [username, setUsername] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const unsubscribe = subscribeToAuthState((player) => {
            if (!player) {
                navigate(paths.login, { replace: true });
                return;
            }

            const loadSettings = async () => {
                const profile = await getUserProfile(player.id, {
                    uid: player.id,
                    username: player.username,
                    email: player.email,
                    provider: "password",
                });

                const nextProfile = profile ?? {
                    ...defaultProfile,
                    uid: player.id,
                    username: player.username,
                    email: player.email,
                    createdAt: player.createdAt ?? Date.now(),
                };

                setProfileData(nextProfile);
                setUsername(nextProfile.username);
                setLoading(false);
            };

            void loadSettings();
        });

        return unsubscribe;
    }, [navigate]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (saving || !profileData.uid) return;

        setSaving(true);
        setErrorMessage("");
        setSuccessMessage("");

        const result = await updateUserSettings({
            uid: profileData.uid,
            username,
        });

        if (!result.ok) {
            setErrorMessage(result.message);
            setSaving(false);
            return;
        }

        const updatedProfile = await getUserProfile(profileData.uid, {
            uid: profileData.uid,
            username,
            email: profileData.email,
            provider: profileData.provider,
        });

        if (updatedProfile) {
            setProfileData(updatedProfile);
            setUsername(updatedProfile.username);
        }

        setSuccessMessage(result.message);
        setSaving(false);
    };

    if (loading) {
        return (
            <div className={`${styles.page} ${styles.loadingState}`}>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.headerRow}>
                    <div>
                        <h1 className={styles.title}>Settings</h1>
                        <p className={styles.subtitle}>Update your public username and review your account info.</p>
                    </div>
                    <Link to={paths.profile} className={styles.backLink}>
                        Back to profile
                    </Link>
                </div>

                <form className={styles.form} onSubmit={onSubmit}>
                    <label className={styles.field}>
                        Username
                        <input
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Choose a username"
                            autoComplete="username"
                        />
                    </label>

                    <div className={styles.metaGrid}>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Email</span>
                            <span className={styles.metaValue}>{profileData.email || "Not set"}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Provider</span>
                            <span className={styles.metaValue}>{profileData.provider}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>User ID</span>
                            <span className={styles.metaValue}>{profileData.uid}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Joined</span>
                            <span className={styles.metaValue}>
                                {new Date(profileData.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {errorMessage && <p className={styles.error}>{errorMessage}</p>}
                    {successMessage && <p className={styles.success}>{successMessage}</p>}

                    <div className={styles.actions}>
                        <button className={styles.primaryButton} type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
