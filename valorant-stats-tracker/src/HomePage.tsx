import { useGameContext } from "./GameContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const { games } = useGameContext();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold">Valorant Game Stats</h1>
      <div className="flex space-x-4 mb-6">
        <Button onClick={() => navigate("/add-tournaments")}>Add Tournaments</Button>
        <Button onClick={() => navigate("/add-game")}>Add Game</Button>
        <Button onClick={() => navigate("/edit-teams")}>Edit Teams</Button>
      </div>

      {games.length === 0 ? (
        <p className="text-gray-500">No games added yet.</p>
      ) : (
        <div className="space-y-4">
          {games.map((game, idx) => (
            <div key={idx} className="border rounded-xl p-4 shadow">
              <div className="text-lg font-semibold">
                {game.teamA} vs {game.teamB}
              </div>
              <div className="text-sm text-gray-600">
                {game.date} — {game.map} — Final Score: {game.score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
