import style from "./Lobby.module.css";
import COLORS from "../../constants/colors";
import LobbyWindow from "./LobbyWindow";


function Lobby() {
    return <div className={style.lobby} style={{ backgroundColor: COLORS.QUIZ_DARK_PURPLE }}><LobbyWindow /></div>;
}

export default Lobby;