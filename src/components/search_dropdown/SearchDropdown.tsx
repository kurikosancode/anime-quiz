import React, { useState } from "react";
import style from "./SearchDropdown.module.css";
import icons from "../../constants/icons";

interface SearchDropdownProps {
    value: string;
    placeholder: string;
    loading: boolean;
    setValue: (value: string) => void;
    items: React.ReactNode[];
    emptyText?: string;
}

const loadingText = "Loading...";

function SearchDropdown({ value, loading, setValue, items, placeholder, emptyText = "No results" }: SearchDropdownProps) {
    const [focused, setFocused] = useState(false);
    const resultClassNames = [style.searchResults];
    const showResults = focused && (loading || items.length > 0 || value.trim().length > 0);

    if (loading && focused) {
        resultClassNames.push(style.searchResultsLoading);
    }
    if (showResults && !loading) {
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
                    aria-label={placeholder}
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
                        {items.length === 0 && <li className={style.emptyResult}>{emptyText}</li>}
                    </ul>
                )}
            </div>

        </div >
    );
}

export default SearchDropdown;
