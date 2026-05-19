import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "../pages/Home";
import About from "../pages/About";
import Lobby from "../pages/lobby/Lobby";
import Play from "../pages/play/Play";
import PlayResults from "../pages/play/Results";
import Profile from "../pages/Profile";
import UserSearch from "../pages/UserSearch.tsx";
import Leaderboard from "../pages/Leaderboard";
import Settings from "../pages/Settings.tsx";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import paths from "../constants/paths";
import MainLayout from "../layouts/MainLayout";
import { subscribeToAuthState } from "../auth/playerAuth";
import { GameSessionProvider } from "../contexts/GameSessionContext";
import ProtectedPlayRoute from "../components/ProtectedPlayRoute";

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
        <GameSessionProvider>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path={paths.home} element={<Home />} />
                    <Route path={paths.about} element={<About />} />
                    <Route
                        path={paths.play}
                        element={
                            <ProtectedPlayRoute>
                                <Play />
                            </ProtectedPlayRoute>
                        }
                    />
                    <Route path={paths.playResults} element={<PlayResults />} />
                    <Route path={paths.lobby} element={<Lobby />} />
                    <Route path={paths.userSearch} element={<UserSearch />} />
                    <Route path={paths.profile} element={<Profile />} />
                    <Route path={`${paths.profile}/:uid`} element={<Profile />} />
                    <Route path={paths.leaderboard} element={<Leaderboard />} />
                    <Route path={paths.settings} element={<Settings />} />
                    <Route path={paths.login} element={<Login />} />
                    <Route path={paths.register} element={<Register />} />
                </Route>
            </Routes>
        </GameSessionProvider>
    );
}
