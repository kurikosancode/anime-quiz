import React, { useState } from "react";
import style from "./SearchDropdown.module.css";
import icons from "../../constants/icons";

interface SearchDropdownProps {
    value: any;
    placeholder: string;
    loading: boolean;
    setValue: (value: any) => void;
    items: React.ReactNode[];
}

const loadingText = "Loading...";

function SearchDropdown({ value, loading, setValue, items, placeholder }: SearchDropdownProps) {
    const [focused, setFocused] = useState(false);
    const resultClassNames = [style.searchResults];
    if (loading && focused) {
        resultClassNames.push(style.searchResultsLoading);
    }
    if (!loading && focused && items.length > 0) {
        resultClassNames.push(style.searchResultsShowing);
    }
    return (
        < div className={style.searchDropdown} >
            <div className={style.searchBar}>
                <div className={style.searchIconDiv}>
                    <img className={style.searchIcon} src={icons.searchIcon} alt={icons.searchIconAlt} />
                </div>
                <input
                    type="text"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className={style.searchInput}
                />
            </div>
            <div className={resultClassNames.join(" ")}>
                {loading && <h3 style={{ color: 'gray' }}>{loadingText}</h3>}
                {!loading && focused && (
                    <ul className={style.itemList}>
                        {items.map((item, index) => (
                            <li key={index}>
                                {item}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        </div >
    );
}

export default SearchDropdown;
