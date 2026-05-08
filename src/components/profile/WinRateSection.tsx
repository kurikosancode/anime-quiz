import styles from "./WinRateSection.module.css";

type WinRateSectionProps = {
    totalWins: number;
    totalQuizzesPlayed: number;
};

export default function WinRateSection({ totalWins, totalQuizzesPlayed }: WinRateSectionProps) {
    const winRate = totalQuizzesPlayed === 0 ? 0 : Math.round((totalWins / totalQuizzesPlayed) * 100);
    const losses = totalQuizzesPlayed - totalWins;

    return (
        <div className={styles.section}>
            <h3 className={styles.title}>Win Rate</h3>

            <div className={styles.winRateDisplay}>
                <div className={styles.largePercentage}>{winRate}%</div>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.label}>Wins</span>
                        <span className={styles.value}>{totalWins}</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.stat}>
                        <span className={styles.label}>Losses</span>
                        <span className={styles.value}>{losses}</span>
                    </div>
                </div>
            </div>

            <div className={styles.progressBarContainer}>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${winRate}%` }}
                    />
                </div>
                <p className={styles.totalGames}>
                    Total Quizzes: {totalQuizzesPlayed}
                </p>
            </div>
        </div>
    );
}
