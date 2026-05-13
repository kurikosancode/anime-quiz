import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import navbarConstants from "../constants/navbar-constants";
import websiteInfo from "../constants/website-info";
import paths from "../constants/paths";
import { subscribeToAuthState, logoutPlayer } from "../auth/playerAuth";
import styles from "./Navbar.module.css";

const resize = "resize";
const hamburgerLogo = "☰";
const xLogo = "×";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [currentPlayerName, setCurrentPlayerName] = useState<string | null>(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const isLoggedIn = currentPlayerName !== null;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > navbarConstants.smallWindow) {
                setOpen(false);
            }
        };

        window.addEventListener(resize, handleResize);
        return () => window.removeEventListener(resize, handleResize);
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState((player) => {
            setCurrentPlayerName(player?.username ?? null);
            if (!player) {
                setProfileMenuOpen(false);
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const handleWindowClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && !target.closest("[data-profile-menu]")) {
                setProfileMenuOpen(false);
            }
        };

        window.addEventListener("click", handleWindowClick);
        return () => window.removeEventListener("click", handleWindowClick);
    }, []);

    const handleLogout = async () => {
        await logoutPlayer();
        setCurrentPlayerName(null);
        setProfileMenuOpen(false);
        setOpen(false);
    };

    const DefaultAvatar = () => (
        <svg className={styles.avatarIcon} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8.2" r="3.4" />
            <path d="M4.8 19.2c1.7-3.3 4-5 7.2-5s5.5 1.7 7.2 5" />
        </svg>
    );

    const ProfileMenu = () => (
        <div className={styles.profileMenuWrap} data-profile-menu>
            <button
                className={styles.avatarButton}
                onClick={() => setProfileMenuOpen((value) => !value)}
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
                type="button"
            >
                <DefaultAvatar />
            </button>
            {profileMenuOpen && (
                <div className={styles.profileMenu}>
                    <div className={styles.profileMenuName}>{currentPlayerName}</div>
                    <Link to={paths.profile} className={styles.profileMenuItem} onClick={() => setProfileMenuOpen(false)}>
                        Profile
                    </Link>
                    <Link to={paths.settings} className={styles.profileMenuItem} onClick={() => setProfileMenuOpen(false)}>
                        Settings
                    </Link>
                    <button className={styles.profileMenuItem} onClick={handleLogout} type="button">
                        Logout
                    </button>
                </div>
            )}
        </div>
    );

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
                    <Link to={paths.lobby} className={styles.link} onClick={() => setOpen(false)}>Play</Link>
                    <Link to={paths.leaderboard} className={styles.link} onClick={() => setOpen(false)}>Leaderboard</Link>
                    {!isLoggedIn ? (
                        <>
                            <Link to={paths.login} className={styles.link} onClick={() => setOpen(false)}>Login</Link>
                            <Link to={paths.register} className={styles.link} onClick={() => setOpen(false)}>Register</Link>
                        </>
                    ) : (
                        <ProfileMenu />
                    )}
                </div>

                <div className={styles.linkWrap}>
                    <Link to={paths.home} className={styles.link} onClick={() => setOpen(false)}>Home</Link>
                    <Link to={paths.lobby} className={styles.link} onClick={() => setOpen(false)}>Play</Link>
                    <Link to={paths.leaderboard} className={styles.link} onClick={() => setOpen(false)}>Leaderboard</Link>
                </div>

                <div className={styles.authWrap}>
                    {!isLoggedIn ? (
                        <>
                            <Link to={paths.login} className={styles.link} onClick={() => setOpen(false)}>Login</Link>
                            <Link to={paths.register} className={styles.link} onClick={() => setOpen(false)}>Register</Link>
                        </>
                    ) : (
                        <ProfileMenu />
                    )}
                </div>
            </nav>
        </header>
    );
}
