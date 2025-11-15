import style from "./LobbyWindow.module.css";
import SearchDropdown from "../../components/search_dropdown/SearchDropdown";
import type AnimeResultProps from "../../props/AnimeResultProps";
import AnimeResult from "../../components/anime_result/AnimeResult";
import fetchAnime from "../../api/AnimeFetcher";
import limits from "../../constants/limits";
import delay from "../../constants/delay";
import Container from "../../components/container/Container";
import AnimeCard from "../../components/anime_card/AnimeCard";
import api from "../../constants/api";
import { useState, useEffect } from "react";

function LobbyWindow() {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [animeResults, setAnimeResults] = useState([]);
    const [animeInput, setAnimeInput] = useState<AnimeResultProps[]>([]);

    const selectAnime = (anime: AnimeResultProps) => {
        setAnimeInput(prev => [...prev, anime]);
    };

    const removeAnime = (animeId: number) => {
        setAnimeInput(prev => prev.filter(anime => anime.animeId !== animeId));
    }


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
                    onSelect={() => selectAnime(anime)}
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
            <Container>
                {animeInput.map(anime => (
                    <AnimeCard
                        key={anime.animeId}
                        animeName={anime.animeName}
                        animeImage={anime.imagePath}
                        animeUrl={anime.animeUrl}
                        onDelete={() => removeAnime(anime.animeId)}
                    />
                ))}
            </Container>

        </div>
    );
}

export default LobbyWindow;
