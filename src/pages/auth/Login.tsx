import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import paths from "../../constants/paths";
import styles from "./Auth.module.css";
import { loginPlayer, signInWithGoogleProvider, subscribeToAuthState } from "../../auth/playerAuth";

export default function Login() {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [googleSubmitting, setGoogleSubmitting] = useState(false);

    useEffect(() => {
        return subscribeToAuthState((player) => {
            if (player) {
                navigate(paths.lobby, { replace: true });
            }
        });
    }, [navigate]);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setErrorMessage("");

        const result = await loginPlayer({ identifier, password });
        if (!result.ok) {
            setErrorMessage(result.message);
            setSubmitting(false);
            return;
        }

        navigate(paths.lobby, { replace: true });
    };

    const onGoogleSignIn = async () => {
        if (googleSubmitting) return;

        setGoogleSubmitting(true);
        setErrorMessage("");

        const result = await signInWithGoogleProvider();
        if (!result.ok) {
            setErrorMessage(result.message);
            setGoogleSubmitting(false);
            return;
        }

        navigate(paths.lobby, { replace: true });
    };

    const continueAsGuest = () => {
        navigate(paths.lobby, { replace: true });
    };

    return (
        <div className={styles.authPage}>
            <form className={styles.authCard} onSubmit={onSubmit}>
                <h1 className={styles.authTitle}>Login</h1>

                <label className={styles.field}>
                    Username or Email
                    <input
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        placeholder="enter username or email"
                        autoComplete="username"
                    />
                </label>

                <label className={styles.field}>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="enter password"
                        autoComplete="current-password"
                    />
                </label>

                {errorMessage && <p className={styles.messageError}>{errorMessage}</p>}

                <button className={styles.primaryButton} type="submit" disabled={submitting}>
                    {submitting ? "Logging in..." : "Login"}
                </button>

                <div className={styles.buttonRow}>
                    <button className={styles.secondaryButton} type="button" onClick={continueAsGuest}>
                        Continue as Guest
                    </button>

                    <button
                        className={styles.googleIconButton}
                        type="button"
                        onClick={onGoogleSignIn}
                        disabled={googleSubmitting}
                        title={googleSubmitting ? "Connecting..." : "Sign in with Google"}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    </button>
                </div>

                <p className={styles.authSwitch}>
                    No account yet? <Link to={paths.register}>Register</Link>
                </p>
            </form>
        </div>
    );
}
