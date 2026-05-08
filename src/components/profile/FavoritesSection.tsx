import styles from "./FavoritesSection.module.css";

type FavoritesSectionProps = {
    favoriteAnime: string[];
};

export default function FavoritesSection({ favoriteAnime }: FavoritesSectionProps) {
    return (
        <div className={styles.section}>
            <h3 className={styles.title}>Favorite Anime</h3>

            {favoriteAnime.length === 0 ? (
                <p className={styles.empty}>
                    Play more quizzes to discover your favorite anime!
                </p>
            ) : (
                <div className={styles.animeList}>
                    {favoriteAnime.slice(0, 10).map((anime, idx) => (
                        <div key={idx} className={styles.animeItem}>
                            <span className={styles.rank}>#{idx + 1}</span>
                            <span className={styles.name}>{anime}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
