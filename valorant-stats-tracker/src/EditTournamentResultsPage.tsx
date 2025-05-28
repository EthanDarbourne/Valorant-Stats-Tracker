import React, { useState, useEffect, useRef } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { useNavigate, useParams } from "react-router-dom";
import { useTournamentById } from "./ApiCallers";
import { Tournament } from "../../shared/TournamentSchema";
import { updateTournamentGamesAndPlacements } from "./ApiPosters";
import HomeButton from './components/ui/HomeButton';

interface TeamEntry {
  index: number;
  name: string;
  placement: number;
  games: (string | null)[];
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

const DroppableCell = ({ id, children }: { id: string; onDrop: (id: string) => void; children?: React.ReactNode }) => {
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [tournament, setTournament] = useState<Tournament>({
    Id: -1,
    Name: "",
    Location: "",
    StartDate: "",
    EndDate: "",
    Completed: false,
    Teams: []
  },);
      
  useTournamentById(Number(id), setTournament);
  
  const maxGameCount = 10;
  const [gameCount, setGameCount] = useState(3);
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const oppositeGamesRef = useRef<[number, number][][]>([]);
  useEffect(() => {
    oppositeGamesRef.current = create2DArray(teams.length, maxGameCount, defaultValue);
  }, [teams.length, maxGameCount]);

  useEffect(() => {
    const teamData = tournament.Teams.map((team, index) => ({
      index: index,
      name: team.Name,
      placement: team.Placement ?? 0,
      games: Array(gameCount).fill(null),
    }));
    setTeams(teamData);
  }, [tournament.Teams]);

  const getTeamIdx = (name: string) => {
    return teams.findIndex(team => team.name === name);
  }

  const getNextFreeGameIdx = (index: number) => {
    return teams[index].games.findIndex(team => team == null);
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const [_, fromTeam, fromIndex] = active.id.split("__");
    const [__, toTeam, toIndex] = over.id.split("__");

    // can only rearrange game order in team
    if(fromTeam !== toTeam) return;

    const opponentName = teams.find((t) => t.name === fromTeam)?.games[parseInt(fromIndex)];
    if (!opponentName) return;

    setTeams((prev) => {
      let updated = [...prev];
      const idx = getTeamIdx(fromTeam);
      const [item] = updated[idx].games.splice(parseInt(fromIndex), 1); // remove the item
      updated[idx].games.splice(parseInt(toIndex), 0, item); // insert at new index
      return updated;
    });
  };

  const sortedTeams = [...teams].sort((a, b) => a.placement - b.placement);

  const addGameSlot = () => {
    if(gameCount === maxGameCount) return;
    setTeams((prev) => prev.map((team) => ({ ...team, games: [...team.games, null] })));
    setGameCount((prev) => prev + 1);
  };

  const removeGameSlot = () => {
    if (gameCount <= 0) return;
    setTeams((prev) => prev.map((team) => ({ ...team, games: team.games.slice(0, -1) })));
    setGameCount((prev) => prev - 1);
  };

  const handlePlacementChange = (index: number, value: number) => {
    if(value < 1 || value > teams.length) return;
    setTeams((prev) => {
      const updated = [...prev];
      updated[index].placement = value;
      return updated;
    });
  };

  function create2DArray<T>(rows: number, cols: number, defaultValue: T): T[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(defaultValue));
  }
  const defaultValue: [number, number] = [-1,-1]

  function updateGamePair(
    pair1: [number, number],
    pair2: [number, number],
    value1: string | null,
    value2: string | null
  ) {
    setTeams(prevTeams => {
      const [teamIdx1, gameIdx1] = pair1;
      const [teamIdx2, gameIdx2] = pair2;

      // Defensive: return original if indices are invalid
      if (
        teamIdx1 < 0 || teamIdx1 >= prevTeams.length ||
        gameIdx1 < 0 || gameIdx1 >= prevTeams[teamIdx1].games.length || 
        teamIdx2 < 0 || teamIdx2 >= prevTeams.length ||
        gameIdx2 < 0 || gameIdx2 >= prevTeams[teamIdx2].games.length
      ) {
        return prevTeams;
      }
      oppositeGamesRef.current[teamIdx1][gameIdx1] = pair2;
      oppositeGamesRef.current[teamIdx2][gameIdx2] = pair1;

      // Deep copy of teams array
      const updatedTeams = [...prevTeams];

      // Copy and update team 1
      const updatedTeam1 = {
        ...updatedTeams[teamIdx1],
        games: [...updatedTeams[teamIdx1].games],
      };
      updatedTeam1.games[gameIdx1] = value1;

      // Copy and update team 2
      const updatedTeam2 = {
        ...updatedTeams[teamIdx2],
        games: [...updatedTeams[teamIdx2].games],
      };
      updatedTeam2.games[gameIdx2] = value2;

      // Replace updated teams
      updatedTeams[teamIdx1] = updatedTeam1;
      updatedTeams[teamIdx2] = updatedTeam2;

      return updatedTeams;
    });
  }

  const handleOpponentChange = (teamIdx: number, gameIdx: number, value: string) => {
    if(value === "") {
      // clearing an opponent (clear from both teams)
      const oppositeTeam = oppositeGamesRef.current[teamIdx][gameIdx]
      updateGamePair([teamIdx, gameIdx], oppositeTeam, null, null);
    }
    else {
      // adding an opponent 
      const oppoTeamIdx = getTeamIdx(value);
      const nextIdx = getNextFreeGameIdx(oppoTeamIdx);
      updateGamePair([teamIdx, gameIdx], [oppoTeamIdx, nextIdx], value, teams[teamIdx].name);
    }
  }

  const navigate = useNavigate();
  const goBack = () => navigate("/add-tournaments");

  const onSubmit = async () => {

    let formErrors: { [key: string]: string } = {};

    let needsPlacementChanges = false;
    let needsGameRearranged = false;
    let placements = Array(teams.length).fill(-1);

    teams.forEach(team => {
      if(placements[team.placement - 1] != -1) {
        needsPlacementChanges = true;
      }
      placements[team.placement - 1] = -1;
      let seenEmpty = false;
      team.games.forEach(game => {
        if(game == null) {
          seenEmpty = true;
        }
        else if(seenEmpty) {
          needsGameRearranged = true;
        }
      })
    })
    // validate form

    if(needsGameRearranged) {
      formErrors.RearrangeGames = "There are gaps between games that need to be filled";
    }
    if(needsPlacementChanges) {
        // placements don't need to be filled out yet (use 0 as placeholder for null)
    //   formErrors.MissingPlacements = "Some placements are not filled out";
    }
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return; // Don't submit if there are errors
    }
    // submit games

    await updateTournamentGamesAndPlacements({
      TournamentId: Number(id), 
      Results: teams.map((team) => ({
        Name: team.name,
        Placement: team.placement == 0 ? null : team.placement,
        Games: team.games,
      }))
    });

    goBack();
  }




  return (
    <div>
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
            {sortedTeams.map((team) => (
              <tr key={team.name}>
                <td className="border px-2 py-1 font-medium">{team.name}</td>
                <td className="border px-2 py-1">
                  <input
                    type="number"
                    value={team.placement}
                    onChange={(e) => handlePlacementChange(team.index, parseInt(e.target.value))}
                    className="w-16 border rounded px-1"
                    min="1"
                    max={`${sortedTeams.length}`}
                  />
                </td>
                {team.games.map((opponent, gameIndex) => (
                  <DroppableCell
                    key={gameIndex}
                    id={`cell__${team.name}__${gameIndex}`}
                    onDrop={() => {}}
                  >
                    {opponent ? (
                      <div className="flex items-center justify-between w-full">
                        <DraggableOpponent id={`cell__${team.name}__${gameIndex}`}>
                          <span>{opponent}</span>
                        </DraggableOpponent>
                        <button
                          type="button"
                          onClick={() => handleOpponentChange(team.index, gameIndex, "")}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          D
                        </button>
                      </div>
                    ) : (
                      <select
                        name="tournament"
                        onChange={e => {e.preventDefault();handleOpponentChange(team.index, gameIndex, e.target.value)}}
                        className="w-full border rounded-md p-2 bg-white"
                        value="" 
                    >
                        <option key="" value="">Select Opponent</option>
                        {teams.map(t => t.name).filter(t => t !== team.name).map(t => (<option key={t} value={t}>{t}</option>))}
                    </select>
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

    {errors.RearrangeGames && <div className="text-red-600 text-sm">{errors.RearrangeGames}</div>}
    {errors.MissingPlacements && <div className="text-red-600 text-sm">{errors.MissingPlacements}</div>}

    <button onClick={_ => onSubmit()} className="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Save Changes
      </button>
      <button onClick={_ => goBack()} className="mt-6 px-4 py-2 rounded">
        Go Back
      </button>
      <HomeButton />
      </div>
  );
};

export default EditTournamentPlacements;
