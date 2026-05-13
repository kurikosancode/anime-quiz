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
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import paths from "../../constants/paths";
import { useGameSession } from "../../contexts/GameSessionContext";

const difficultyOptions = ["Easy", "Normal", "Hard"] as const;
const timeLimitOptions = ["5", "10", "15", "20"] as const;
const questionCountOptions = ["5", "10", "15", "20"] as const;

type LobbySettings = {
    difficulty: (typeof difficultyOptions)[number];
    timeLimit: (typeof timeLimitOptions)[number];
    questionCount: (typeof questionCountOptions)[number];
};

function LobbyWindow() {
    const navigate = useNavigate();
    const { setSession } = useGameSession();
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [animeResults, setAnimeResults] = useState<AnimeResultProps[]>([]);
    const [animeInput, setAnimeInput] = useState<AnimeResultProps[]>([]);
    const [difficulty, setDifficulty] = useState<LobbySettings["difficulty"]>("Normal");
    const [timeLimit, setTimeLimit] = useState<LobbySettings["timeLimit"]>("10");
    const [questionCount, setQuestionCount] = useState<LobbySettings["questionCount"]>("10");
    const requestIdRef = useRef(0);

    const play = () => {
        if (animeInput.length === 0) return;
        const settings: LobbySettings = {
            difficulty,
            timeLimit,
            questionCount,
        };

        setSession({
            animeNames: animeInput.map(anime => anime.animeName),
            settings,
        });

        navigate(paths.play);
    };

    const clearSelection = () => {
        setAnimeInput([]);
    };

    const selectAnime = (anime: AnimeResultProps) => {
        setAnimeInput(prev => prev.find(a => a.animeId === anime.animeId) ? prev : [...prev, anime]);
    };

    const removeAnime = (animeId: number) => {
        setAnimeInput(prev => prev.filter(anime => anime.animeId !== animeId));
    };


    const getAnimeResults = async (query: string) => {
        const requestId = ++requestIdRef.current;
        setLoading(true);

        const apiUrl = query.length < 1
            ? api.animeDefaultUrl(limits.resultLimit)
            : api.animeSearchUrl(query, limits.resultLimit);

        const result = await fetchAnime(query, apiUrl);

        if (requestId !== requestIdRef.current) {
            return;
        }

        setAnimeResults(result);
        setLoading(false);
    };

    const animeResultItems = useMemo(() => {
        return animeResults.map((anime) => (
            <AnimeResult
                key={anime.animeId}
                animeId={anime.animeId}
                animeName={anime.animeName}
                animeUrl={anime.animeUrl}
                imagePath={anime.imagePath}
                genres={anime.genres}
                onSelect={() => selectAnime(anime)}
            />
        ));
    }, [animeResults]);

    useEffect(() => {
        const query = value.trim();

        const timeoutId = setTimeout(() => {
            getAnimeResults(query);
        }, delay.queryDelay);

        return () => clearTimeout(timeoutId);
    }, [value]);

    return (
        <div className={style.lobbyWindow}>
            <div className={style.hero}>
                <h1 className={style.header}>Quiz Lobby</h1>
            </div>

            <div className={style.panelGrid}>
                <div className={style.leftColumn}>
                    <section className={style.panel}>
                        <div className={style.panelHeader}>
                            <h2 className={style.sectionTitle}>Search Anime</h2>
                            <span className={style.metaText}>{loading ? "Loading..." : `${animeResults.length} results`}</span>
                        </div>


                        <div className={style.searchDiv}>
                            <SearchDropdown
                                loading={loading}
                                placeholder={"Search anime"}
                                value={value}
                                setValue={setValue}
                                items={animeResultItems}
                                emptyText={value.trim() ? "No anime found for this search." : "Start typing to search anime."}
                            />
                        </div>
                    </section>

                    <section className={style.panel}>
                        <div className={style.panelHeader}>
                            <h2 className={style.sectionTitle}>Selected Anime</h2>
                            <button
                                className={style.secondaryButton}
                                onClick={clearSelection}
                                disabled={animeInput.length === 0}
                            >
                                Clear
                            </button>
                        </div>

                        {animeInput.length === 0 && (
                            <div className={style.emptyState}>
                                <p>No anime selected yet.</p>
                                <span>Your selected anime will appear here.</span>
                            </div>
                        )}

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
                    </section>
                </div>

                <section className={style.panel + " " + style.settingsPanel}>
                    <div className={style.panelHeader}>
                        <h2 className={style.sectionTitle}>Settings</h2>
                    </div>

                    <div className={style.settingsGrid}>
                        <label className={style.settingField}>
                            <span>Difficulty</span>
                            <select
                                value={difficulty}
                                onChange={(event) => setDifficulty(event.target.value as LobbySettings["difficulty"])}
                            >
                                {difficultyOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </label>

                        <label className={style.settingField}>
                            <span>Time Limit</span>
                            <select
                                value={timeLimit}
                                onChange={(event) => setTimeLimit(event.target.value as LobbySettings["timeLimit"])}
                            >
                                {timeLimitOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </label>

                        <label className={style.settingField}>
                            <span>Questions</span>
                            <select
                                value={questionCount}
                                onChange={(event) => setQuestionCount(event.target.value as LobbySettings["questionCount"])}
                            >
                                {questionCountOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className={style.settingSummary}>
                        <p>{difficulty} difficulty</p>
                        <p>{timeLimit}s per round</p>
                        <p>{questionCount} questions</p>
                    </div>
                </section>
            </div>

            <div className={style.bottomActions}>
                <button className={style.playButton} onClick={play} disabled={animeInput.length === 0}>
                    Start Quiz
                </button>
            </div>
        </div>
    );
}

export default LobbyWindow;
