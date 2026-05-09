import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "../pages/Home";
import About from "../pages/About";
import Lobby from "../pages/lobby/Lobby";
import Play from "../pages/play/Play";
import PlayResults from "../pages/play/Results";
import Profile from "../pages/Profile";
import Leaderboard from "../pages/Leaderboard";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import paths from "../constants/paths";
import MainLayout from "../layouts/MainLayout";
import { subscribeToAuthState } from "../auth/playerAuth";

function RootRedirect() {
    const navigate = useNavigate();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState((player) => {
            navigate(player ? paths.play : paths.login, { replace: true });
            setReady(true);
        });

        return unsubscribe;
    }, [navigate]);

    return ready ? null : null;
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<RootRedirect />} />
                <Route path={paths.home} element={<Home />} />
                <Route path={paths.about} element={<About />} />
                <Route path={paths.play} element={<Play />} />
                <Route path={paths.playResults} element={<PlayResults />} />
                <Route path={paths.lobby} element={<Lobby />} />
                <Route path={paths.profile} element={<Profile />} />
                <Route path={paths.leaderboard} element={<Leaderboard />} />
                <Route path={paths.login} element={<Login />} />
                <Route path={paths.register} element={<Register />} />
            </Route>
        </Routes>
    );
}
