import style from "./LobbyWindow.module.css";
import SearchDropdown from "../../components/search_dropdown/SearchDropdown";
import { useState } from "react";

function LobbyWindow() {
    const [value, setValue] = useState("");
    return (
        <div className={style.lobbyWindow}>
            <SearchDropdown value={value} setValue={setValue} items={[]} />
        </div>
    );
}

export default LobbyWindow;
