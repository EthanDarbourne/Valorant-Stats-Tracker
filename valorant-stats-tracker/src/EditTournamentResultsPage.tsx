import React, { useState, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { useParams } from "react-router-dom";
import { useTeamsByTournament, useTournamentById } from "./ApiCallers";

interface TeamEntry {
  name: string;
  placement: number;
  games: (string | null)[];
}

interface Props {
  initialTeams: string[];
  initialPlacements?: Record<string, number>;
  initialGamesCount?: number;
}

const DraggableOpponent = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...listeners}
      {...attributes}
      className="cursor-move border rounded px-1 bg-white"
    >
      {children}
    </div>
  );
};

const DroppableCell = ({ id, onDrop, children }: { id: string; onDrop: (id: string) => void; children?: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <td
      ref={setNodeRef}
      className={`border px-2 py-1 ${isOver ? "bg-blue-100" : ""}`}
    >
      {children}
    </td>
  );
};

const EditTournamentPlacements = () => {

    const { id } = useParams<{ id: string }>();

  const initialGamesCount = useState<number>(3);

  const initialTeams = useState<string[]>([]);

  const [tournament, setTournament] = useState<Tournament>({
        Id: -1,
        Name: "",
        Location: "",
        StartDate: "",
        EndDate: "",
        Completed: false,
        Winner: "",
        Teams: []
      },);

  useTournamentById(Number(id), setTournament);

  initialTeams = useTeamsByTournament(tournament.Id)

  const [gameCount, setGameCount] = useState(initialGamesCount);
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const teamData = initialTeams.map((team) => ({
      name: team,
      placement: initialPlacements[team] ?? 0,
      games: Array(gameCount).fill(null),
    }));
    setTeams(teamData);
  }, [initialTeams]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const [_, fromTeam, fromIndex] = active.id.split("__");
    const [__, toTeam, toIndex] = over.id.split("__");

    const opponentName = teams.find((t) => t.name === fromTeam)?.games[parseInt(fromIndex)];
    if (!opponentName) return;

    setTeams((prev) => {
      const updated = [...prev];

      // Remove opponent from old slot
      const fromIdx = updated.findIndex((t) => t.name === fromTeam);
      updated[fromIdx].games[parseInt(fromIndex)] = null;

      // Add opponent to new slot
      const toIdx = updated.findIndex((t) => t.name === toTeam);
      updated[toIdx].games[parseInt(toIndex)] = opponentName;

      return updated;
    });
  };

  const sortedTeams = [...teams].sort((a, b) => a.placement - b.placement);

  const addGameSlot = () => {
    setTeams((prev) => prev.map((team) => ({ ...team, games: [...team.games, null] })));
    setGameCount((prev) => prev + 1);
  };

  const removeGameSlot = () => {
    if (gameCount <= 0) return;
    setTeams((prev) => prev.map((team) => ({ ...team, games: team.games.slice(0, -1) })));
    setGameCount((prev) => prev - 1);
  };

  const handlePlacementChange = (index: number, value: number) => {
    setTeams((prev) => {
      const updated = [...prev];
      updated[index].placement = value;
      return updated;
    });
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="p-4">
        <div className="mb-4 flex gap-2">
          <button onClick={addGameSlot} className="bg-blue-500 text-white px-3 py-1 rounded">
            + Game
          </button>
          <button onClick={removeGameSlot} className="bg-red-500 text-white px-3 py-1 rounded">
            − Game
          </button>
        </div>
        <table className="min-w-full table-auto border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Team</th>
              <th className="border px-2 py-1">Placement</th>
              {[...Array(gameCount)].map((_, i) => (
                <th key={i} className="border px-2 py-1">
                  Game {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, teamIndex) => (
              <tr key={team.name}>
                <td className="border px-2 py-1 font-medium">{team.name}</td>
                <td className="border px-2 py-1">
                  <input
                    type="number"
                    value={team.placement}
                    onChange={(e) => handlePlacementChange(teamIndex, parseInt(e.target.value))}
                    className="w-16 border rounded px-1"
                  />
                </td>
                {team.games.map((opponent, gameIndex) => (
                  <DroppableCell
                    key={gameIndex}
                    id={`cell__${team.name}__${gameIndex}`}
                    onDrop={() => {}}
                  >
                    {opponent ? (
                      <DraggableOpponent id={`cell__${team.name}__${gameIndex}`}>
                        {opponent}
                      </DraggableOpponent>
                    ) : (
                      <span className="text-gray-400">Empty</span>
                    )}
                  </DroppableCell>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <DragOverlay>
          {activeId && <div className="bg-white border rounded px-2 py-1 shadow">{activeId.split("__")[0]}</div>}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default EditTournamentPlacements;
