import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import About from "../pages/About";
import Play from "../pages/play/Play";
import paths from "../constants/paths";
import MainLayout from "../layouts/MainLayout";

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path={paths.home} element={<Home />} />
                <Route path={paths.about} element={<About />} />
                <Route path={paths.play} element={<Play />} />
            </Route>
        </Routes>
    );
}
