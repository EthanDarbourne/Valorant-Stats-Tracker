import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Game {
  teamA: string;
  teamB: string;
  map: string;
  date: string;
  score: string;
}

interface GameContextType {
  games: Game[];
  addGame: (game: Game) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [games, setGames] = useState<Game[]>([]);

  const addGame = (game: Game) => {
    setGames((prevGames) => [...prevGames, game]);
  };

  return (
    <GameContext.Provider value={{ games, addGame }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
