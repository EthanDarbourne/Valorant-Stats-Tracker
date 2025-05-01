import React, { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTitle, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { useGameContext } from "./GameContext";

const teams = ["G2", "SEN", "C9", "NRG", "FURIA", "LEV", "MIBR", "2G", "100T", "LOUD", "EG", "KRU"];


const duelists = ["Jett", "Neon", "Yoru", "Raze", "Phoenix", "Reyna", "Waylay", "Iso"];
const initiators = ["Breach", "Sova", "Skye", "Tejo", "KAYO", "Fade", "Gekko"];
const controllers = ["Astra", "Brimstone", "Omen", "Viper", "Harbor", "Clove"]
const sentinels = ["Cypher", "Killjoy", "Vyse", "Sage", "Chamber", "Deadlock"]
const agents = [...duelists, ...initiators, ...controllers, ...sentinels];

export default function AddGamePage() {
  const [formData, setFormData] = useState({
    teamA: "",
    teamB: "",
    map: "",
    date: "",
    score: "",
  });
  
  const red = "bg-red-500"
  const blue = "bg-blue-500"
  const empty = "bg-yellow-200"

  // Error state for multiple errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [roundDetails, setRoundDetails] = useState(Array(24).fill({ winner: "", notes: "" }));
  const [activeRound, setActiveRound] = useState<number | null>(null);
  const [dialogInput, setDialogInput] = useState({ winner: "", notes: "" });

  const [teamAAgents, setTeamAAgents] = useState<string[]>(Array(5).fill(""));
  const [teamBAgents, setTeamBAgents] = useState<string[]>(Array(5).fill(""));

  const navigate = useNavigate();
  const { addGame } = useGameContext();

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

  const handleSubmit = () => {

    let formErrors: { [key: string]: string } = {};

    var canCountRounds = true;
    if (formData.teamA === "" || formData.teamB === "") {
      formErrors.selectTeams = "Must select two teams";
      canCountRounds = false;
    }
    else if (formData.teamA === formData.teamB) {
      formErrors.teamA = "Team A and Team B must be different.";
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
      if(isPreviousRoundMissingWinner && round.winner != "") {
          formErrors.missingRoundWinner = "Skipped a round winner, please fill in"
        }
        if(round.winner == formData.teamA) ++teamARounds;
        else if(round.winner == formData.teamB) ++teamBRounds;
        else isPreviousRoundMissingWinner = true;
      });
  
      if((teamARounds < 13 && teamBRounds < 13) || Math.abs(teamARounds - teamBRounds) < 2) {
        formErrors.invalidScore = "This is an invalid score"
      }
      else {
        formData.score = `${teamARounds}-${teamBRounds}`
      }

    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return; // Don't submit if there are errors
    }

    addGame(formData);
    navigate("/");
  };

  const openRoundDialog = (index: number) => {
    setActiveRound(index);
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

  const renderAgentDropdowns = (
    selectedAgents: string[],
    team: "A" | "B"
  ) => {
    return selectedAgents.map((selected, index) => {
      const availableAgents = agents.filter(
        (a) => !selectedAgents.includes(a) || a === selected
      );
  
      return (
        <select
          key={index}
          value={selected}
          onChange={(e) => handleAgentChange(team, index, e.target.value)}
          className="p-2 border rounded w-48 text-black mb-2"
        >
          <option value="">Select Agent</option>
          {availableAgents.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>
      );
    });
  };
  

  const getRoundColor = (winner: string) => {
    if (winner === formData.teamA && formData.teamA != "") return blue + " text-white hover:!" + blue;
    if (winner === formData.teamB && formData.teamB != "") return red + " text-white hover:!" + red;
    return empty + " text-white hover:!" + empty; // fallback for no winner
  };

  return (
    <div className="min-h-screen w-screen p-4 space-y-4 text-black bg-white">
      <h1 className="text-2xl font-bold">Add a Valorant Game</h1>

      <div className="flex gap-4">
        <select
          name="teamA"
          value={formData.teamA}
          onChange={handleChange}
          className="flex-1 border rounded-md p-2 bg-white text-black"
        >
          <option value="">Select Team A</option>
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
        <select
          name="teamB"
          value={formData.teamB}
          onChange={handleChange}
          className="flex-1 border rounded-md p-2 bg-white text-black"
        >
          <option value="">Select Team B</option>
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      {errors.selectTeams && <div className="text-red-600 text-sm">{errors.selectTeams}</div>} {}
      {errors.teamA && <div className="text-red-600 text-sm">{errors.teamA}</div>} {}

      <div className="flex gap-12">
        <div>
          <h2 className="font-semibold mb-2">Team A Agents</h2>
          {renderAgentDropdowns(teamAAgents, "A")}
        </div>
        <div>
          <h2 className="font-semibold mb-2">Team B Agents</h2>
          {renderAgentDropdowns(teamBAgents, "B")}
        </div>
      </div>

      <select
        name="map"
        value={formData.map}
        onChange={handleChange}
        className="w-full border rounded-md p-2 bg-white"
      >
        <option value="">Select Map</option>
        <option value="Ascent">Ascent</option>
        <option value="Fracture">Fracture</option>
        <option value="Haven">Haven</option>
        <option value="Icebox">Icebox</option>
        <option value="Lotus">Lotus</option>
        <option value="Pearl">Pearl</option>
        <option value="Split">Split</option>
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
          const winner = round.winner;
          const colorClass = getRoundColor(winner);
          
          const handleRoundClick = (e: React.MouseEvent) => {
            if (e.shiftKey) {
              openRoundDialog(index);
            } else {
              // Cycle through TeamA -> TeamB -> None
              let nextWinner = "";
              if (winner === "") nextWinner = formData.teamA;
              else if (winner === formData.teamA) nextWinner = formData.teamB;
              else nextWinner = "";
              
              const updatedRounds = [...roundDetails];
              updatedRounds[index] = { ...updatedRounds[index], winner: nextWinner };
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
          <DialogContent className="space-y-4 text-black">
            {activeRound !== null && (
              <>
                <DialogTitle>Round {activeRound + 1} Info</DialogTitle>
                <DialogDescription>
                  Enter details about this round such as who won and any important notes.
                </DialogDescription>
                <select
                  value={dialogInput.winner}
                  onChange={(e) => setDialogInput({ ...dialogInput, winner: e.target.value })}
                  className="w-full border rounded-md p-2 bg-beige-300 text-black"
                >
                  <option value="">Select Winner</option>
                  <option value={formData.teamA}>{formData.teamA}</option>
                  <option value={formData.teamB}>{formData.teamB}</option>
                </select>
                <Input
                  placeholder="Notes about the round"
                  value={dialogInput.notes}
                  onChange={(e) => setDialogInput({ ...dialogInput, notes: e.target.value })}
                  className="text-black"
                />
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
      </div>
    </div>
  );
}
