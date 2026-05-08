import { useLocation, useNavigate } from "react-router-dom";
import style from "./Results.module.css";
import paths from "../../constants/paths";

type ResultsState = {
    score: number;
    totalRounds?: number;
};

export default function PlayResults() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const s = (state || {}) as ResultsState;

    const onBack = () => navigate(paths.lobby);
    const onPlayAgain = () => navigate(paths.lobby);

    return (
        <div className={style.resultsPage}>
            <h1>Quiz Finished</h1>
            <div className={style.scoreBox}>
                <div>Score</div>
                <div className={style.scoreNumber}>{s.score ?? 0}</div>
                <div>{s.totalRounds ? `${s.totalRounds} rounds` : ""}</div>
            </div>

            <div className={style.actions}>
                <button className={style.btn} onClick={onBack}>Back to Lobby</button>
                <button className={`${style.btn} ${style.ghost}`} onClick={onPlayAgain}>Play Again</button>
            </div>
        </div>
    );
}
