import ChoiceBox from "../../components/choice_box/ChoiceBox";
import style from "./PlayWindow.module.css";
import COLORS from "../../constants/colors";
import { useState, useEffect, useRef } from "react";
import { AnimeCharacterFetcher } from "../../api/AnimeCharacterFetcher";
import { AnimeImageFetcher } from "../../api/AnimeImageFetcher";
import delayAfterChoice from "../../constants/delay";
import random from "../../utils/random";

const boxColors = [COLORS.QUIZ_BLUE, COLORS.QUIZ_CYAN, COLORS.QUIZ_YELLOW, COLORS.QUIZ_RED];
function PlayWindow() {
    const [characters, setCharacters] = useState<string[]>([]);
    const [score, setScore] = useState<number>(0);
    const [correctCharacter, setCorrectCharacter] = useState<string | null>(null);
    const [pressed, setPressed] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>("");

    const animeCharacterFetcher = new AnimeCharacterFetcher();
    const animeImageFetcher = new AnimeImageFetcher();
    const animes = ["One Punch Man"];

    const setPress = async (character: string) => {
        setPressed(true);
        if (correctCharacter == character) {
            setScore(score => score + 1);
            console.log(score);
        }
        await loadImage();

    };

    async function loadImage() {
        try {
            const animeTitle = random.getRandom(animes);
            let [chosenCharacter, newCharacters] = await animeCharacterFetcher.getRandomCharacterForQuiz(animeTitle);
            const blob = await animeImageFetcher.retrieveImage(animeTitle, chosenCharacter);
            const url = URL.createObjectURL(blob);
            setTimeout(() => {
                setImageUrl(url);
                setCharacters(newCharacters);
                setPressed(false);
                setCorrectCharacter(chosenCharacter);
            }, delayAfterChoice);
        } catch (e) {
            console.error("Failed to fetch character image." + e);
        }
    }

    const fetchedRef = useRef(false);

    // i use useRef since it development mode in react mounts components twice
    useEffect(() => {
        if (!fetchedRef.current) {
            loadImage();
            fetchedRef.current = true;
        }
    }, []);

    return (
        <div className={style.playWindow}>
            <div className={style.top}>
                <h1 id={style.scoreText}>Score: {score}</h1>
                <img src={imageUrl} className={style.animeImage} />
            </div>

            <div className={style.choices}>
                {characters.map((character, i) => {
                    const boxColor = boxColors[i];
                    const isCorrect = character === correctCharacter;
                    return (
                        <ChoiceBox
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
