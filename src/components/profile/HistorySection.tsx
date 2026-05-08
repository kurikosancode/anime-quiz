import styles from "./HistorySection.module.css";

type RecentGame = {
    id: string;
    animeTitle: string;
    score: number;
    timestamp: number;
};

type HistorySectionProps = {
    recentGames: RecentGame[];
};

export default function HistorySection({ recentGames }: HistorySectionProps) {
    const formatTime = (timestamp: number): string => {
        if (timestamp === 0) return "No games yet";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={styles.section}>
            <h3 className={styles.title}>Recent Games</h3>

            {recentGames.length === 0 ? (
                <p className={styles.empty}>
                    Start playing to see your game history!
                </p>
            ) : (
                <div className={styles.gameList}>
                    {recentGames.slice(0, 10).map((game) => (
                        <div key={game.id} className={styles.gameItem}>
                            <div className={styles.gameInfo}>
                                <p className={styles.animeTitle}>{game.animeTitle}</p>
                                <p className={styles.timestamp}>{formatTime(game.timestamp)}</p>
                            </div>
                            <span className={styles.score}>{game.score}pts</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
