import { useEffect, useState } from "react";
import styles from "./Leaderboard.module.css";
import { getLeaderboard, type LeaderboardEntry } from "../services/userProfile";

export default function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLeaderboard = async () => {
            const leaderboard = await getLeaderboard(25);
            setEntries(leaderboard);
            setLoading(false);
        };

        void loadLeaderboard();
    }, []);

    return (
        <div className={styles.page}>
            <section className={styles.card}>
                <h1 className={styles.title}>Leaderboard</h1>
                <p className={styles.subtitle}>Top players by highest average score</p>

                {loading ? (
                    <p className={styles.empty}>Loading leaderboard...</p>
                ) : entries.length === 0 ? (
                    <p className={styles.empty}>No ranked players yet. Finish a game to appear here.</p>
                ) : (
                    <div className={styles.tableWrap}>
                        <div className={styles.headerRow}>
                            <span>Rank</span>
                            <span>Player</span>
                            <span>Avg Score</span>
                            <span>Games</span>
                            <span>Questions</span>
                        </div>

                        {entries.map((entry, index) => (
                            <div key={entry.uid} className={styles.row}>
                                <span className={styles.rank}>#{index + 1}</span>
                                <span className={styles.player}>{entry.username}</span>
                                <span className={styles.score}>{entry.averageScore.toFixed(1)}%</span>
                                <span>{entry.totalQuizzesPlayed}</span>
                                <span>{entry.totalQuestionsAttempted}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
