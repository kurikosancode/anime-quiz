import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";
import paths from "../constants/paths";
import { subscribeToAuthState } from "../auth/playerAuth";
import { getLeaderboard, type LeaderboardEntry } from "../services/userProfile";

function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState((player) => {
            setIsLoggedIn(Boolean(player));
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const loadLeaderboardPreview = async () => {
            const entries = await getLeaderboard(3);
            setTopPlayers(entries);
        };

        void loadLeaderboardPreview();
    }, []);

    const topAverage = topPlayers[0]?.averageScore ?? 0;
    const topPlayer = topPlayers[0]?.username ?? "No players yet";

    return (
        <div className={styles.homePage}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.kicker}>AniQuiz</p>
                    <h1 className={styles.title}>Guess the character. Race the timer. Climb the board.</h1>
                    <p className={styles.subtitle}>
                        Play fast anime rounds, track your streaks, and compare your average score against other players.
                    </p>

                    <div className={styles.actions}>
                        <Link to={paths.lobby} className={styles.primaryButton}>
                            {isLoggedIn ? "Play now" : "Play as guest"}
                        </Link>
                        <Link to={paths.leaderboard} className={styles.secondaryButton}>
                            View leaderboard
                        </Link>
                    </div>
                </div>

            </section>

            <section className={styles.fullWidthSection}>
                <article className={styles.card}>
                    <p className={styles.cardLabel}>How it works</p>
                    <ol className={styles.steps}>
                        <li>Pick your anime list and settings in the lobby.</li>
                        <li>Guess the character before the timer runs out.</li>
                        <li>Save your results and improve your streak.</li>
                    </ol>
                </article>
            </section>

            <section className={styles.rowSection}>
                <div className={styles.heroPanel}>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Top average score</span>
                        <strong className={styles.heroStatValue}>{topAverage.toFixed(1)}%</strong>
                    </div>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Current leader</span>
                        <strong className={styles.heroStatValue}>{topPlayer}</strong>
                    </div>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Progress</span>
                        <strong className={styles.heroStatValue}>{topPlayers.length} players</strong>
                    </div>
                </div>
            </section>

            <section className={styles.rowSection}>
                <div className={styles.quickLinksPanel}>
                    <p className={styles.cardLabel}>Quick links</p>
                    <div className={styles.linkStack}>
                        <Link to={paths.profile} className={styles.inlineLink}>Your profile</Link>
                        <Link to={paths.settings} className={styles.inlineLink}>Account settings</Link>
                        <Link to={paths.userSearch} className={styles.inlineLink}>Search users</Link>
                    </div>
                </div>
            </section>

            {/* Leaderboard preview removed from home; dedicated leaderboard page remains */}
        </div>
    );
}

export default Home;