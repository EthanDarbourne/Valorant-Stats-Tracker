import React, { useState, ChangeEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTitle, DialogContent, DialogDescription } from "@/components/ui/dialog";
import DragAndDropList, { DragAndDropListHandle } from "@/components/ui/DragDropList"
import { useGameContext } from "@/GameContext";
import { useAgents, useMaps, useTeamsByTournamentId, useTournamentGamesById, useTournaments } from "./ApiCallers"
import HomeButton from "./components/ui/HomeButton";
import { Game } from "../../shared/GameSchema";
import { DefaultTournament, TournamentInfo } from "../../shared/TournamentSchema";
import { OtherMap, PlayerStats, RoundInfo, StatLine, TournamentMap } from "../../shared/EntireGameSchema";
import { roles } from "./Constants";
import { updateOtherGame, updateTournamentGame } from "./ApiPosters";
import AgentImage from "./components/ui/AgentCard";

// Information To Submit
// two submits:
// SubmitGameInDatabase:
// GameId: number,
// Date: string
// TeamIdDefendingFirst: number,
// Players: [TeamId: , PlayerId:, FirstHalfStats: , TotalStats: , Agent: ,] // todo: Clutches, FB, FD, 2K,3K,4K,5K
// Rounds: [Winner: , Notes: , Events: ]

// calculated on backend:
// score

// SubmitNewGame:
// GameName:
// Date: string
// TeamIdDefendingFirst: number,
// IsPlayer, is the player that is submitting the game playing this agent, assume first agent is player
// Players: [IsPlayer:bool, FirstHalfStats: , TotalStats: , Agent: ,] // todo: Clutches, FB, FD, 2K,3K,4K,5K
// Rounds: [Winner: , Notes: , Events: ]

export default function AddGamePage() {
  const [formData, setFormData] = useState({
    title: "",
    tournament: "",
    game: "",
    mapCount: 3,
    mapNumber: 1,
    teamAId: -1,
    teamAName: "",
    teamBId: -1,
    teamBName: "",
    map: "",
    date: "",
    score: "",
  });
  
  const red = "bg-red-500"
  const blue = "bg-blue-500"
  const empty = "bg-yellow-200"

  // Error state for multiple errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [game, setGame] = useState<Game | undefined>();
  const [roundDetails, setRoundDetails] = useState<RoundInfo[]>(Array.from({ length: 24 }, (_, index) => ({
        GameId: game?.Id ?? -1,
        RoundNumber: index + 1,
        RoundWinnerId: -1,
        Notes: "",
        Events: []
    })));
  const [activeRound, setActiveRound] = useState<number | null>(null);
  const [dialogInput, setDialogInput] = useState<RoundInfo>({ GameId: -1, RoundNumber: -1, RoundWinnerId: -1, Notes: "", Events: [] });
  const [startingEvents, setStartingEvents] = useState<string[]>([]);
  const agents = useAgents();
  
  const [teamAAgents, setTeamAAgents] = useState<string[]>(Array(5).fill(""));
  const [teamBAgents, setTeamBAgents] = useState<string[]>(Array(5).fill(""));
  const [teamAFirstHalfStats, setTeamAFirstHalfStats] = useState<string[]>(Array(5).fill(""));
  const [teamATotalStats, setTeamATotalStats] = useState<string[]>(Array(5).fill(""));
  const [teamBFirstHalfStats, setTeamBFirstHalfStats] = useState<string[]>(Array(5).fill(""));
  const [teamBTotalStats, setTeamBTotalStats] = useState<string[]>(Array(5).fill(""));

  const [tournament, setTournament] = useState<TournamentInfo>(DefaultTournament);
  
  const maps = useMaps();
  const [isGameInDatabase, setGameInDatabase] = useState<boolean>(false);
  
  const [tournaments, _] = useTournaments();
  const [teams] = useTeamsByTournamentId(tournament.Id);
  
  const navigate = useNavigate();
  const { addGame } = useGameContext();
  
  const [games, _setGames] = useTournamentGamesById(tournament.Id);


  const defendingFirst = true;

  const handleTournamentChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTournament(tournaments.find(x => x.Id == Number(e.target.value)) ?? DefaultTournament);
    if(e.target.value == "") formData.game = "";
    setGameInDatabase(e.target.value != "");
    handleChange(e);
  };

  const handleGameChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const game = games.find(x => x.Id == Number(e.target.value))
    formData.mapCount = game?.MapCount ?? 1
    formData.teamAName = game?.TeamNameA ?? ""
    formData.teamBName = game?.TeamNameB ?? ""
    formData.teamAId = teams.find(x => x.Name == formData.teamAName)?.Id ?? -1
    formData.teamBId = teams.find(x => x.Name == formData.teamBName)?.Id ?? -1
    setGame(game);
    handleChange(e);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: "" })); // Clear error on field change
  };

  const handleAgentChange = (
    team: "A" | "B",
    index: number,
    value: string
  ) => {
    const currentAgents = team === "A" ? [...teamAAgents] : [...teamBAgents];
    if (currentAgents.includes(value)) return; // prevent duplicates
  
    currentAgents[index] = value;
    team === "A" ? setTeamAAgents(currentAgents) : setTeamBAgents(currentAgents);
  };

  const handleSubmit = async () => {

    let formErrors: { [key: string]: string } = {};

    var canCountRounds = true;
    if (formData.teamAName === "") {
      formErrors.selectTeams = "Must select team A";
      canCountRounds = false;
    }
    else if(formData.teamBName === "") {
      formErrors.selectTeams = "Must select team B";
      canCountRounds = false;
    }

    if (formData.map === "") {
      formErrors.selectMap = "Must select a map"
    }

    if(canCountRounds) {
      var teamARounds = 0
      var teamBRounds = 0
      
      var isPreviousRoundMissingWinner = false;
      roundDetails.forEach((round, _) => {
      if(isPreviousRoundMissingWinner && round.RoundWinnerId != -1) {
          formErrors.missingRoundWinner = "Skipped a round winner, please fill in"
        }
        if(round.RoundWinnerId == formData.teamAId) ++teamARounds;
        else if(round.RoundWinnerId == formData.teamBId) ++teamBRounds;
        else isPreviousRoundMissingWinner = true;
      });
  
      if((teamARounds < 13 && teamBRounds < 13) || Math.abs(teamARounds - teamBRounds) < 2) {
        formErrors.invalidScore = "This is an invalid score"
      }
      else {
        formData.score = `${teamARounds}-${teamBRounds}`
      }
    }

    if(teamAAgents.filter(x => x !== "").length < 5) {
      formErrors.missingAgentsTeamA = "Missing agents for team A"
    }
    
    if(teamBAgents.filter(x => x !== "").length < 5) {
      formErrors.missingAgentsTeamB = "Missing agents for team B"
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return; // Don't submit if there are errors
    }

    const parseStat = (stat: string): StatLine => {
        const split = stat.split('/');
        return {
            Kills: Number(split[0]), Deaths: Number(split[1]), Assists: Number(split[2]),
        }
    }

    const getPlayerId = (teamName: string, index: number) => {
        const players = teams.find(x => x.Name == teamName)?.Players;
        const playerName = GetPlayerNameRow(teamName)[index];
        const ret = players?.find(x => x.Name == playerName)?.Id;
        if(ret === undefined) {
            throw new Error(`Can't find player ${playerName} at ${index} for team ${teamName} with players ${players}`)
        }
        return ret;
    }

    const playerAStats: PlayerStats[] = Array.from({ length: 5 }, (_, i) => i).map(i => ({
        TeamId: formData.teamAId,
        Agent: teamAAgents[i],
        PlayerId: getPlayerId(formData.teamAName, i),
        FirstHalfStats: parseStat(teamAFirstHalfStats[i]),
        TotalStats: parseStat(teamATotalStats[i])
    }));

    const playerBStats: PlayerStats[] = Array.from({ length: 5 }, (_, i) => i).map(i => ({
        TeamId: formData.teamBId,
        Agent: teamBAgents[i],
        PlayerId: getPlayerId(formData.teamBName, i),
        FirstHalfStats: parseStat(teamBFirstHalfStats[i]),
        TotalStats: parseStat(teamBTotalStats[i])
    }));

    let res: Response;
    if(isGameInDatabase) {
        // submit 
        if(game === undefined) {
            throw new Error("Game is undefined");
        }
        const tournamentGame: TournamentMap = {
            TournamentId: tournament.Id,
            GameId: game.Id,
            TeamA: { TeamId: formData.teamAId, DefendingFirst: defendingFirst, Players: playerAStats },
            TeamB: { TeamId: formData.teamBId, DefendingFirst: !defendingFirst, Players: playerBStats },
            MapNumber: Number(formData.mapNumber),
            MapName: formData.map,
            Date: formData.date,
            Rounds: roundDetails.filter(x => x.RoundWinnerId !== -1)
        }

        res = await updateTournamentGame(tournamentGame);
    }
    else {

        const otherGame: OtherMap = {};
        res = await updateOtherGame(otherGame);
    }
    if(res.status != 200) {
      console.log("Failed");
      return;
    }
    //addGame(formData);
    navigate("/");
  };

  const openRoundDialog = (index: number) => {
    if(teamAAgents.some(x => x == "") || teamBAgents.some(x => x == ""))return;
    setActiveRound(index);
    setStartingEvents(roundDetails[index].Events);
    setDialogInput(roundDetails[index]);
  };

  const saveRoundDetails = () => {
    const updatedRounds = [...roundDetails];
    if (activeRound !== null) {
      updatedRounds[activeRound] = dialogInput;
      setRoundDetails(updatedRounds);
      setActiveRound(null);
    }
  };

  const saveEvents = (events: string[]) => {
    if (activeRound === null)return;
    const updatedRounds = [...roundDetails];
    updatedRounds[activeRound].Events = events;
    setRoundDetails(updatedRounds);
  }

  const renderAgentDropdowns = (
    selectedAgents: string[],
    team: "A" | "B"
  ) => {
    return (<div className="flex gap-2">
        {selectedAgents.map((selected, index) => {
      const availableAgents = agents.filter(
        (a) => !selectedAgents.includes(a) || a === selected
      );
  
      return (
        <select
        key={team + '-' + index}
        value={selected}
        onChange={(e) => handleAgentChange(team, index, e.target.value)}
        className="p-2 border border-gray-400 rounded w-1/5 text-black mb-2"
        >
        <option value="">Select Agent</option>
        {availableAgents.map((agent) => (
            <option key={agent} value={agent}>
            {agent}
            </option>
        ))}
        </select>
      );
    })}</div>);
  };

  const renderPlayerNames = (teamName?: string) => {
    if(isGameInDatabase && teamName) {
        return <div className="flex gap-2">{GetPlayerNameRow(teamName).map(x => (<div key={x} className="p-2 border border-gray-400 rounded w-1/5 text-black mb-2">{x}</div>))}</div>
    }
    return 
  }
  
  const FixMapNumber = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

    handleChange(e);
    const newValue = parseInt(e.target.value);
    if(formData.mapNumber > newValue) {
      setFormData((prev) => ({ ...prev, mapNumber: newValue }));
    }
  }

  const getRoundColor = (winner: number) => {
    if (winner === formData.teamAId && formData.teamAId != -1) return blue + " text-white hover:" + blue;
    if (winner === formData.teamBId && formData.teamBId != -1) return red + " text-white hover:" + red;
    return empty + " text-white hover:" + empty; // fallback for no winner
  };

  const getFullGameName = (game: Game) => {
    return `${game.TeamNameA} vs ${game.TeamNameB} BO${game.MapCount} Meeting: ${game.MatchNumber}`
  }

  const GetPlayerNameRow = (teamName?: string): string[] => {
    const players = teams.find(x => x.Name == teamName)?.Players;

    const playerNames: string[] = Array(5);
    roles.forEach((role, index) => {
        playerNames[index] = players?.find(x => x.Role == role)?.Name ?? "";
    })
    return playerNames;
  }

  const renderStatInputs = (
        stats: string[],
        setStats: React.Dispatch<React.SetStateAction<string[]>>,
        keyPrefix: string,
        placeholder: string
    ) => (
        <div className="flex gap-2 mb-4">
            {stats.map((value, index) => (
                <input
                    key={`${keyPrefix}-${index}`}
                    type="text"
                    className="w-1/5 p-2 border border-gray-400 rounded"
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => {
                        const updated = [...stats];
                        updated[index] = e.target.value;
                        setStats(updated);
                    }}
                />
            ))}
        </div>);

const listRef = useRef<DragAndDropListHandle>(null);
    function DragListWithAgents() {

      const handleAdd = (teamName: string, agentName: string) => {
          listRef.current?.addItem(`Death:${teamName}-${agentName}`);
      };

      return (
          <>
          <div className="flex">{teamAAgents.map(x => <AgentImage agentName={x} onClick={() => handleAdd(formData.teamAName, x)}/>)}</div>
          <div className="flex">{teamBAgents.map(x => <AgentImage agentName={x} onClick={() => handleAdd(formData.teamBName, x)}/>)}</div>
                
                
              <DragAndDropList
                  ref={listRef}
                  startingValues={startingEvents} allowDuplicates={true} hasClutchItem={true} onChange={saveEvents}
              />
          </>
      );
  }

  return (
    <div className="min-h-screen w-screen p-4 space-y-4 text-black bg-white">

      <div>
        <h1 className="text-2xl font-bold">Add a Valorant Game</h1>
        <div className="flex items-center gap-x-4">

        {/* Add a list of tournaments that can be selected*/}
        <select
            name="tournament"
            value={formData.tournament}
            onChange={handleTournamentChange}
            className="w-1/3 border rounded-md p-2 bg-white"
        >
            <option key="" value="">Select Tournament</option>
            {tournaments.map(t => [t.Id, t.Name]).map(t => (<option key={t[0]} value={t[0]}>{t[1]}</option>))}
        </select>

        {isGameInDatabase ?
            (<select
                name="game"
                value={formData.game}
                onChange={handleGameChange}
                className="w-1/3 border rounded-md p-2 bg-white"
                >
                <option key="" value="">Select Game</option>
                {games.map(x => [x.Id, getFullGameName(x)]).map(t => (<option key={t[0]} value={t[0]}>{t[1]}</option>))}
            </select>) : (
            <input
                name="game"
                type="text"
                placeholder="Enter game name"
                value={formData.game}
                onChange={handleChange}
            />
        )}
        {!isGameInDatabase && <select
            name="mapCount"
            value={formData.mapCount}
            onChange={FixMapNumber}
            className="border rounded-md p-2 text-black"
        >
            <option value="1">BO1</option>
            <option value="3">BO3</option>
            <option value="5">BO5</option>
        </select>}
        <div>Map :</div>
        <input
            type="number"
            name="mapNumber"
            value={formData.mapNumber}
            onChange={handleChange}
            className="border rounded-md p-2 text-black"
            min="1"
            step="1"
            max={formData.mapCount}
        />
      </div>

      </div>

      <div className="flex w-full">
        <div className="w-1/2 bg-blue-100 p-4">
          {/* Team A Name Selector*/}
          <select
            name="teamA"
            value={formData.teamAName}
            onChange={handleChange}
            disabled={isGameInDatabase}
            className="flex-1 border rounded-md p-2 bg-white text-black"
          >
            <option value="">Select Team A</option>
            {teams
              .filter((team) => team.Name !== formData.teamBName)
              .map((team) => (
              <option key={team.Id} value={team.Name}>
                {team.Name}
              </option>
            ))}
          </select>

          {errors.selectTeamA && <div className="text-red-600 text-sm">{errors.selectTeamA}</div>}
          {/* Team A Agent Selectors*/}

          <div>
            <h2 className="font-semibold mb-2">Team A Agents</h2>
            {renderPlayerNames(game?.TeamNameA)}
            {renderAgentDropdowns(teamAAgents, "A")}
            {isGameInDatabase && (
                <>
                    {renderStatInputs(teamAFirstHalfStats, setTeamAFirstHalfStats, 'First-A', 'First Half Stats')}
                    {renderStatInputs(teamATotalStats, setTeamATotalStats, 'Total-A', 'Total Stats')}
                </>
            )}
          </div>
          {errors.missingAgentsTeamA && <div className="text-red-600 text-sm">{errors.missingAgentsTeamA}</div>}
        </div>

        <div className="w-1/2 bg-red-100 p-4">

          {/* Team B Name Selector*/}
          <select
            name="teamB"
            value={formData.teamBName}
            onChange={handleChange}
            disabled={isGameInDatabase}
            className="flex-1 border rounded-md p-2 bg-white text-black"
            >
            <option value="">Select Team B</option>
            {teams
              .filter((team) => team.Name !== formData.teamAName)
              .map((team) => (
                <option key={team.Id} value={team.Name}>
                {team.Name}
              </option>
            ))}
          </select>

          {errors.selectTeamB && <div className="text-red-600 text-sm">{errors.selectTeamB}</div>}
          {/* Team B Agent Selectors*/}
          <div>
            <h2 className="font-semibold mb-2">Team B Agents</h2>
            {renderPlayerNames(game?.TeamNameB)}
            {renderAgentDropdowns(teamBAgents, "B")}
            {isGameInDatabase && (
                <>
                    {renderStatInputs(teamBFirstHalfStats, setTeamBFirstHalfStats, 'First-B', 'First Half Stats')}
                    {renderStatInputs(teamBTotalStats, setTeamBTotalStats, 'Total-B', 'Total Stats')}
                </>
            )}
          </div>
          {errors.missingAgentsTeamB && <div className="text-red-600 text-sm">{errors.missingAgentsTeamB}</div>}

        </div>
      </div>

      <select
        name="map"
        value={formData.map}
        onChange={handleChange}
        className="w-full border rounded-md p-2 bg-white"
      >
        <option key="" value="">Select Map</option>
        {maps.map(map => (<option key={map} value={map}>{map}</option>))}
      </select>

      {errors.selectMap && <div className="text-red-600 text-sm">{errors.selectMap}</div>}

      <Input
        name="date"
        placeholder="Date (e.g., 2025-04-29)"
        value={formData.date}
        onChange={handleChange}
        />

      <div className="flex gap-2 overflow-x-auto whitespace-nowrap py-2">
        {roundDetails.map((round, index) => {
          const winner = round.RoundWinnerId;
          const colorClass = getRoundColor(winner);
          
          const handleRoundClick = (e: React.MouseEvent) => {
            if (e.shiftKey) {
              openRoundDialog(index);
            } else {
              // Cycle through TeamA -> TeamB -> None

              let nextWinner = -1;
              if (winner === -1) nextWinner = formData.teamAId;
              else if (winner === formData.teamAId) nextWinner = formData.teamBId;
              else nextWinner = -1;
              const updatedRounds = [...roundDetails];
              updatedRounds[index] = { ...updatedRounds[index], RoundWinnerId: nextWinner };
              setRoundDetails(updatedRounds);
            }
          };

          return (
            <Button
            key={index}
            className={`${colorClass} w-10`}
            onClick={handleRoundClick}
            >
              R{index + 1}
            </Button>
          );
        })}
      </div>

      {errors.missingRoundWinner && <div className="text-red-600 text-sm">{errors.missingRoundWinner}</div>}
      {errors.invalidScore && <div className="text-red-600 text-sm">{errors.invalidScore}</div>}

      <Dialog open={activeRound !== null} onOpenChange={(open) => {
          if (!open) setActiveRound(null);
        }}>
          <DialogContent className="space-y-4 text-black max-h-[100vh] overflow-y-auto">
            {activeRound !== null && (
              <>
                <DialogTitle>Round {activeRound + 1} Info</DialogTitle>
                <DialogDescription>
                  Enter details about this round such as who won and any important notes.
                </DialogDescription>
                <select
                  value={dialogInput.RoundWinnerId}
                  onChange={(e) => setDialogInput({ ...dialogInput, RoundWinnerId: Number(e.target.value) })}
                  className="w-full border rounded-md p-2 bg-beige-300 text-black"
                >
                  <option value={-1}>Select Winner</option>
                  <option value={formData.teamAId}>{formData.teamAName}</option>
                  <option value={formData.teamBId}>{formData.teamBName}</option>
                </select>
                <Input
                  placeholder="Notes about the round"
                  value={dialogInput.Notes}
                  onChange={(e) => setDialogInput({ ...dialogInput, Notes: e.target.value })}
                  className="text-black"
                />
                {DragListWithAgents()}
                {/* <DragAndDropList startingValues={startingEvents} allowDuplicates={true} hasClutchItem={true} onChange={saveEvents}/> */}



                <Button onClick={saveRoundDetails}>Save</Button>
              </>
            )}
          </DialogContent>
        </Dialog>


      <div className="flex gap-4">
        <Button onClick={handleSubmit}>Submit</Button>
        <Button onClick={() => navigate("/")}>
          Cancel
        </Button>
        <HomeButton />
      </div>
    </div>
  );
}
