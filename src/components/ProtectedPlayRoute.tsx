import { Navigate } from "react-router-dom";
import { useGameSession } from "../contexts/GameSessionContext";
import paths from "../constants/paths";

interface ProtectedPlayRouteProps {
    children: React.ReactNode;
}

export default function ProtectedPlayRoute({ children }: ProtectedPlayRouteProps) {
    const { session } = useGameSession();

    if (!session) {
        return <Navigate to={paths.lobby} replace />;
    }

    return <>{children}</>;
}
