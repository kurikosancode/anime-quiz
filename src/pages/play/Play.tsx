import PlayWindow from "./PlayWindow";
import style from "./Play.module.css";
import COLORS from "../../constants/colors";


function Play() {
    return <div className={style.play} style={{ backgroundColor: COLORS.QUIZ_DARK_PURPLE }}><PlayWindow /></div>;
}

export default Play;