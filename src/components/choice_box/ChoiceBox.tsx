import React, { CSSProperties } from "react";
import styles from "./ChoiceBox.module.css";

export interface ChoiceBoxProps {
    text: string;
    isCorrect: boolean;
    initialColor: string;
    onPress: () => void;
    pressed: boolean;
}

function ChoiceBox({
    text,
    isCorrect,
    initialColor,
    onPress,
    pressed,
}: ChoiceBoxProps) {
    const classNames = [styles.choiceBox];

    const additionalStyle: CSSProperties = {
        backgroundColor: pressed ? (isCorrect ? "#6BAE44" : "#F22F3A") : initialColor,
        pointerEvents: pressed ? "none" : "auto",
        transform: pressed && !isCorrect
            ? "scaleY(0.9)" // shrink height if pressed and incorrect
            : "scaleY(1)",  // normal size otherwise
        transition: "transform 0.15s ease, background-color 0.3s ease", // keep smooth animation
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-pressed={pressed}
            onClick={onPress}
            style={additionalStyle}
            className={classNames.join(" ")}
        >
            {text}
        </div>
    );
}

export default ChoiceBox;
