import style from "./Lobby.module.css";
import LobbyWindow from "./LobbyWindow";


function Lobby() {
    return <div className={style.lobby}><LobbyWindow /></div>;
}

export default Lobby;