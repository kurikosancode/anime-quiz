import style from "./LobbyWindow.module.css";
import SearchDropdown from "../../components/search_dropdown/SearchDropdown";
import type AnimeResultProps from "../../props/AnimeResultProps";
import AnimeResult from "../../components/anime_result/AnimeResult";
import fetchAnime from "../../api/AnimeFetcher";
import limits from "../../constants/limits";
import delay from "../../constants/delay";
import api from "../../constants/api";
import { useState, useEffect } from "react";

function LobbyWindow() {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [animeResults, setAnimeResults] = useState([]);
    const [animeInput, setAnimeInput] = useState<string[]>([]);

    const selectAnime = (animeName: string) => {
        setAnimeInput(prev => [...prev, animeName]);
    };

    const getAnimeResults = async (query: string) => {
        setLoading(true);

        const apiUrl = query.length < 1
            ? api.animeDefaultUrl(limits.resultLimit)
            : api.animeSearchUrl(query, limits.resultLimit);

        const result = await fetchAnime(query, apiUrl);

        setAnimeResults(
            result.map((anime: AnimeResultProps) => (
                <AnimeResult
                    key={anime.animeId}
                    animeId={anime.animeId}
                    animeName={anime.animeName}
                    animeUrl={anime.animeUrl}
                    imagePath={anime.imagePath}
                    genres={anime.genres}
                    onSelect={() => selectAnime(anime.animeName)}
                />
            ))
        );

        setLoading(false);
    };

    useEffect(() => {
        const query = value.trim();

        const timeoutId = setTimeout(() => {
            getAnimeResults(query);
        }, delay.queryDelay);

        return () => clearTimeout(timeoutId);
    }, [value]);

    return (
        <div className={style.lobbyWindow}>
            <SearchDropdown loading={loading} placeholder={"Search Anime"} value={value} setValue={setValue} items={animeResults} />
        </div>
    );
}

export default LobbyWindow;
