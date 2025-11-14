import style from "./AnimeResult.module.css";

interface AnimeCardProps {
    animeImage: string;
    animeName: string;
    animeUrl: string;
}

function AnimeCard({
    animeImage, animeName, animeUrl }: AnimeCardProps & { onDelete: () => void }) {

    return (
        <div
            className={style.AnimeCard}
        >
            <a
                href={animeUrl}
                target="_blank"
                rel="noopener noreferrer"
            >

            </a>
        </div>
    );
}

export default AnimeCard;
