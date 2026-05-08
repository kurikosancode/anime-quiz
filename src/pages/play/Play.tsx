import PlayWindow from "./PlayWindow";
import style from "./Play.module.css";
import { useState } from "react";


function Play() {
    const [timeProgress, setTimeProgress] = useState(0);

    return (
        <div className={style.play}>
            <div className={style.timeBarWrap} aria-label="Time remaining" aria-live="polite">
                <div className={style.timeBarTrack}>
                    <div className={style.timeBarFill} style={{ width: `${timeProgress}%` }} />
                </div>
            </div>
            <PlayWindow onTimeProgressChange={setTimeProgress} />
        </div>
    );
}

export default Play;