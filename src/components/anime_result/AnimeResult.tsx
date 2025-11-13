import type AnimeResultProps from "../../props/AnimeResultProps";
import style from "./AnimeResult.module.css";

function AnimeResult({
    animeId,
    animeName,
    animeUrl,
    imagePath,
    genres,
    onSelect
}: AnimeResultProps & { onSelect: () => void }) {

    return (
        <div
            className={style.searchResult}
            onMouseDown={onSelect}
        >
            <img src={imagePath} alt={animeName} />
            <div className={style.textDiv}>
                <p>{animeName}</p>
                <p style={{ color: 'gray' }}>{genres}</p>
            </div>
        </div>
    );
}

export default AnimeResult;

