import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import navbarConstants from "../constants/navbar-constants";
import websiteInfo from "../constants/website-info";
import paths from "../constants/paths";
import styles from "./Navbar.module.css";

const resize = "resize";
const hamburgerLogo = "☰";
const xLogo = "×";

export default function Navbar() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > navbarConstants.smallWindow) {
                setOpen(false);
            }
        };

        window.addEventListener(resize, handleResize);
        return () => window.removeEventListener(resize, handleResize);
    }, []);

    return (
        <header className={styles.header}>
            <button
                className={styles.hamburger}
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu">{hamburgerLogo}</button>
            <nav className={styles.navbar}>
                <div
                    className={`${styles.overlay} ${open ? styles.open : ""}`}
                    onClick={() => setOpen(false)}
                />

                <div className={`${styles.sidebar} ${open ? styles.open : ""}`}>
                    <div className={styles.sidebarHeader}>
                        <h2>{websiteInfo.websiteName}</h2>
                        <button
                            id={styles.xButton}
                            onClick={() => setOpen(false)}>{xLogo}</button>
                    </div>

                    <Link to={paths.home} className={styles.sidebarLink} onClick={() => setOpen(false)}>Home</Link>
                    <Link to={paths.about} className={styles.link} onClick={() => setOpen(false)}>About</Link>
                    <Link to={paths.play} className={styles.link} onClick={() => setOpen(false)}>Play</Link>
                </div>

                <div className={styles.linkWrap}>
                    <Link to={paths.home} className={styles.link} onClick={() => setOpen(false)}>Home</Link>
                    <Link to={paths.about} className={styles.link} onClick={() => setOpen(false)}>About</Link>
                    <Link to={paths.play} className={styles.link} onClick={() => setOpen(false)}>Play</Link>
                </div>
            </nav>
        </header>
    );
}
