import React from "react";
import style from "./SearchDropdown.module.css";
import icons from "../../constants/icons";

interface SearchDropdownProps {
    value: any;
    setValue: (value: any) => void;
    items: React.ReactNode[];
}

const placeholder = "Search Anime";

function SearchDropdown({ value, setValue, items }: SearchDropdownProps) {
    const resultClassNames = [style.searchResults];
    if (items.length === 0) {
        resultClassNames.push(style.searchResultsLoading);
    }
    return (
        <div className={style.searchDropdown}>
            <div className={style.searchBar}>
                <div className={style.searchIconDiv}>
                    <img className={style.searchIcon} src={icons.searchIcon} alt={icons.searchIconAlt} />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className={style.searchInput}
                />
            </div>
            <div className={resultClassNames.join(" ")}>
                {items.length === 0 ? <h3>Loading</h3> : items}
            </div>
        </div>
    );
}

export default SearchDropdown;
