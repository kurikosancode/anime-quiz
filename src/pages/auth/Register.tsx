import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import paths from "../../constants/paths";
import styles from "./Auth.module.css";
import { registerPlayer, signInWithGoogleProvider, subscribeToAuthState } from "../../auth/playerAuth";

export default function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
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
        setSuccessMessage("");

        const result = await registerPlayer({ username, email, password });
        if (!result.ok) {
            setErrorMessage(result.message);
            setSubmitting(false);
            return;
        }

        setSuccessMessage(result.message);
        setUsername("");
        setEmail("");
        setPassword("");

        window.setTimeout(() => {
            navigate(paths.login);
        }, 700);
        setSubmitting(false);
    };

    const onGoogleSignIn = async () => {
        if (googleSubmitting) return;

        setGoogleSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        const result = await signInWithGoogleProvider();
        if (!result.ok) {
            setErrorMessage(result.message);
            setGoogleSubmitting(false);
            return;
        }

        navigate(paths.lobby, { replace: true });
    };

    return (
        <div className={styles.authPage}>
            <form className={styles.authCard} onSubmit={onSubmit}>
                <h1 className={styles.authTitle}>Register</h1>
                <label className={styles.field}>
                    Username
                    <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="choose a username"
                        autoComplete="username"
                    />
                </label>

                <label className={styles.field}>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="enter email"
                        autoComplete="email"
                    />
                </label>

                <label className={styles.field}>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="create password"
                        autoComplete="new-password"
                    />
                </label>

                {errorMessage && <p className={styles.messageError}>{errorMessage}</p>}
                {successMessage && <p className={styles.messageSuccess}>{successMessage}</p>}

                <button className={styles.primaryButton} type="submit" disabled={submitting}>
                    {submitting ? "Registering..." : "Register"}
                </button>

                <button className={styles.secondaryButton} type="button" onClick={onGoogleSignIn} disabled={googleSubmitting}>
                    {googleSubmitting ? "Connecting..." : "Continue with Google"}
                </button>

                <p className={styles.authSwitch}>
                    Already have an account? <Link to={paths.login}>Login</Link>
                </p>
            </form>
        </div>
    );
}
