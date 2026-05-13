import { createContext, useContext, useState, ReactNode } from "react";

type GameSession = {
    animeNames: string[];
    settings: {
        difficulty: string;
        timeLimit: string;
        questionCount: string;
    };
} | null;

interface GameSessionContextType {
    session: GameSession;
    setSession: (session: GameSession) => void;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

export function GameSessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<GameSession>(null);

    return (
        <GameSessionContext.Provider value={{ session, setSession }}>
            {children}
        </GameSessionContext.Provider>
    );
}

export function useGameSession() {
    const context = useContext(GameSessionContext);
    if (!context) {
        throw new Error("useGameSession must be used within GameSessionProvider");
    }
    return context;
}
