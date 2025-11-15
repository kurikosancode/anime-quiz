import style from "./AnimeCard.module.css";

interface AnimeCardProps {
    animeImage: string;
    animeName: string;
    animeUrl: string;
}

function AnimeCard({
    animeImage, animeName, animeUrl, onDelete }: AnimeCardProps & { onDelete: () => void }) {

    return (
        <div
            className={style.animeCard}
        >
            <a
                href={animeUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    src={animeImage}
                    alt={animeName}
                />
                <span>{animeName}</span>
            </a>
            <span
                onClick={onDelete}
                style={{ fontWeight: 'bold' }}
                title="Remove"
            >
                ×
            </span>
        </div>
    );
}

export default AnimeCard;
