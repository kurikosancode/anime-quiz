import ChoiceBox from "../../components/choice_box/ChoiceBox";
import style from "./PlayWindow.module.css";
import COLORS from "../../constants/colors";
import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import paths from "../../constants/paths";
import { AnimeCharacterFetcher } from "../../api/AnimeCharacterFetcher";
import { AnimeImageFetcher } from "../../api/AnimeImageFetcher";
import random from "../../utils/random";
import { getCurrentPlayer } from "../../auth/playerAuth";
import { recordGameSession } from "../../services/userProfile";


const boxColors = [COLORS.QUIZ_BLUE, COLORS.QUIZ_CYAN, COLORS.QUIZ_YELLOW, COLORS.QUIZ_RED];
const roundStartDelay = 500;

type LobbyNavigationState = {
    animeNames: string[];
    settings?: {
        difficulty: string;
        timeLimit: string;
        questionCount: string;
    };
};

type AnimeState = string[] | LobbyNavigationState;

type PlayWindowProps = {
    onTimeProgressChange?: (progress: number) => void;
};


function PlayWindow({ onTimeProgressChange }: PlayWindowProps) {
    const { state } = useLocation() as { state?: AnimeState };
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<string[]>([]);
    const [score, setScore] = useState<number>(0);
    const [correctCharacter, setCorrectCharacter] = useState<string | null>(null);
    const [pressed, setPressed] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [timeRemainingMs, setTimeRemainingMs] = useState<number>(0);
    const isInitialLoadRef = useRef(true);
    const roundsPlayedRef = useRef<number>(0);
    const scoreRef = useRef(0);
    const roundResolvedRef = useRef(false);

    const animeCharacterFetcher = useMemo(() => new AnimeCharacterFetcher(), []);
    const animeImageFetcher = useMemo(() => new AnimeImageFetcher(), []);
    const roundTimerRef = useRef<number | null>(null);
    const timeTickRef = useRef<number | null>(null);
    const advanceTimerRef = useRef<number | null>(null);
    const currentBlobUrlRef = useRef<string>("");
    const isMountedRef = useRef(true);
    const latestLoadIdRef = useRef(0);
    const isFetchingRef = useRef(false);
    const currentAnimeTitleRef = useRef<string>("");
    const roundScoreRef = useRef(0);
    const sessionRoundsRef = useRef<Array<{ id: string; animeTitle: string; score: number; timestamp: number }>>([]);

    const animePool = useMemo(() => {
        if (Array.isArray(state)) {
            return state.filter((anime): anime is string => typeof anime === "string" && anime.length > 0);
        }

        return (state?.animeNames ?? []).filter((anime): anime is string => typeof anime === "string" && anime.length > 0);
    }, [state]);

    const difficulty = useMemo(() => {
        if (!state || Array.isArray(state)) return "medium";
        return state.settings?.difficulty ?? "medium";
    }, [state]);

    const totalRounds = useMemo(() => {
        if (!state || Array.isArray(state)) return undefined;
        const count = parseInt(state.settings?.questionCount ?? "", 10);
        return Number.isFinite(count) && count > 0 ? count : undefined;
    }, [state]);

    const timeLimitSeconds = useMemo(() => {
        if (!state || Array.isArray(state)) return 10;
        const parsed = parseInt(state.settings?.timeLimit ?? "", 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
    }, [state]);

    const revokeCurrentBlobUrl = () => {
        if (currentBlobUrlRef.current) {
            URL.revokeObjectURL(currentBlobUrlRef.current);
            currentBlobUrlRef.current = "";
        }
    };

    const clearRoundTimer = () => {
        if (roundTimerRef.current !== null) {
            window.clearTimeout(roundTimerRef.current);
            roundTimerRef.current = null;
        }
    };

    const clearTimeTick = () => {
        if (timeTickRef.current !== null) {
            window.clearInterval(timeTickRef.current);
            timeTickRef.current = null;
        }
    };

    const clearAdvanceTimer = () => {
        if (advanceTimerRef.current !== null) {
            window.clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = null;
        }
    };

    const preloadImage = (source: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("Failed to preload image."));
            image.src = source;
        });
    };

    const navigateToResults = async () => {
        const finalScore = scoreRef.current;
        const currentPlayer = getCurrentPlayer();

        if (currentPlayer) {
            try {
                // Wait for the DB write, but don't block forever — timeout after 3s.
                await Promise.race([
                    recordGameSession({
                        uid: currentPlayer.id,
                        username: currentPlayer.username,
                        email: currentPlayer.email,
                        animeTitle: animePool.length === 1 ? animePool[0] : "Mixed",
                        score: finalScore,
                        totalRounds: totalRounds,
                        rounds: sessionRoundsRef.current,
                        timestamp: Date.now(),
                    }),
                    new Promise((resolve) => setTimeout(resolve, 3000)),
                ]);
            } catch (err) {
                // If writing failed, log for debugging but still navigate.
                // eslint-disable-next-line no-console
                console.warn("Failed to persist game session to Firestore:", err);
            }
        }

        navigate(paths.playResults, {
            state: {
                score: finalScore,
                totalRounds,
            },
        });
    };

    const scheduleNextRound = () => {
        clearAdvanceTimer();
        advanceTimerRef.current = window.setTimeout(() => {
            if (!isMountedRef.current) return;

            if (typeof totalRounds === "number" && roundsPlayedRef.current >= totalRounds) {
                navigateToResults();
                return;
            }

            void loadImage();
        }, roundStartDelay);
    };

    const finishRound = () => {
        if (roundResolvedRef.current) return;

        roundResolvedRef.current = true;
        clearRoundTimer();
        clearTimeTick();
        setTimeRemainingMs(0);
        setPressed(true);

        const currentPlayer = getCurrentPlayer();
        // Accumulate round result locally; we'll persist the whole session when the game finishes.
        if (currentAnimeTitleRef.current) {
            sessionRoundsRef.current = [
                {
                    id: `${Date.now()}-${currentAnimeTitleRef.current}`,
                    animeTitle: currentAnimeTitleRef.current,
                    score: roundScoreRef.current,
                    timestamp: Date.now(),
                },
                ...sessionRoundsRef.current,
            ].slice(0, 200);
        }

        scheduleNextRound();
    };

    const loadImage = async () => {
        if (animePool.length === 0) {
            return;
        }

        const loadId = ++latestLoadIdRef.current;
        clearRoundTimer();
        clearAdvanceTimer();
        roundResolvedRef.current = false;
        roundScoreRef.current = 0;
        isFetchingRef.current = true;
        setLoading(true);

        try {
            const animeTitle = random.getRandom(animePool);
            currentAnimeTitleRef.current = animeTitle;
            const [chosenCharacter, newCharacters] = await animeCharacterFetcher.getRandomCharacterForQuiz(animeTitle, difficulty as any);
            const blob = await animeImageFetcher.retrieveImage(animeTitle, chosenCharacter);
            const nextUrl = URL.createObjectURL(blob);

            await preloadImage(nextUrl);

            if (!isMountedRef.current) {
                URL.revokeObjectURL(nextUrl);
                return;
            }

            // If another load started after this one, discard this result to avoid swapping.
            if (loadId !== latestLoadIdRef.current) {
                URL.revokeObjectURL(nextUrl);
                return;
            }

            revokeCurrentBlobUrl();
            currentBlobUrlRef.current = nextUrl;
            setImageUrl(nextUrl);
            setCharacters(newCharacters);
            setCorrectCharacter(chosenCharacter);
            setLoading(false);
            setPressed(false);
            if (isInitialLoadRef.current) isInitialLoadRef.current = false;

            roundsPlayedRef.current += 1;

            const roundDurationMs = timeLimitSeconds * 1000;
            const startedAt = window.performance.now();
            setTimeRemainingMs(roundDurationMs);

            clearTimeTick();
            timeTickRef.current = window.setInterval(() => {
                if (!isMountedRef.current || roundResolvedRef.current) return;

                const elapsed = window.performance.now() - startedAt;
                const remaining = Math.max(0, roundDurationMs - elapsed);
                setTimeRemainingMs(remaining);

                if (remaining <= 0) {
                    clearTimeTick();
                }
            }, 100);

            roundTimerRef.current = window.setTimeout(() => {
                if (!isMountedRef.current || roundResolvedRef.current) return;
                finishRound();
            }, roundDurationMs);
        } catch {
            if (isMountedRef.current && loadId === latestLoadIdRef.current) {
                setCharacters([]);
                setCorrectCharacter(null);
                setLoading(false);
                setPressed(false);
                setTimeRemainingMs(0);
            }
        } finally {
            if (loadId === latestLoadIdRef.current) {
                isFetchingRef.current = false;
            }
        }
    };

    const setPress = (character: string) => {
        if (pressed || loading || roundResolvedRef.current) return;

        if (correctCharacter === character) {
            roundScoreRef.current = 1;
            setScore((scoreValue) => {
                const nextScore = scoreValue + 1;
                scoreRef.current = nextScore;
                return nextScore;
            });
        }

        finishRound();
    };

    useEffect(() => {
        const totalMs = timeLimitSeconds * 1000;
        const progress = totalMs > 0
            ? Math.max(0, Math.min(100, (timeRemainingMs / totalMs) * 100))
            : 0;

        onTimeProgressChange?.(progress);
    }, [onTimeProgressChange, timeRemainingMs, timeLimitSeconds]);

    useEffect(() => {
        isMountedRef.current = true;
        void loadImage();

        return () => {
            isMountedRef.current = false;
            clearRoundTimer();
            clearTimeTick();
            clearAdvanceTimer();
            revokeCurrentBlobUrl();
        };
    }, [animePool]);

    if (animePool.length === 0) {
        return (
            <div className={style.playWindow}>
                <h1 id={style.scoreText}>Score: {score}</h1>
                <p>Please select at least one anime from the lobby to start the quiz.</p>
            </div>
        );
    }

    return (
        <div className={style.playWindow}>
            {loading && isInitialLoadRef.current && (
                <div className={style.loadingOverlay}>
                    <div className={style.spinner} aria-hidden />
                    <div style={{ marginLeft: 12, color: "#fff" }}>Loading...</div>
                </div>
            )}
            <div className={style.top}>
                <h1 id={style.scoreText}>Score: {score}</h1>
                {imageUrl && <img src={imageUrl} className={style.animeImage} alt="Anime character" />}
            </div>

            <div className={style.choices}>
                {characters.map((character, i) => {
                    const boxColor = boxColors[i];
                    const isCorrect = character === correctCharacter;
                    return (
                        <ChoiceBox
                            key={`choice-${i}`}
                            text={character}
                            pressed={pressed}
                            isCorrect={isCorrect}
                            onPress={() => setPress(character)}
                            initialColor={boxColor}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default PlayWindow;
