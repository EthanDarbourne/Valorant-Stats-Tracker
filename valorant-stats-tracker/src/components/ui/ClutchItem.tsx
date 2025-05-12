import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import DragAndDropList from "@/components/ui/DragDropList"

const agents = ["Jett", "Clove", "Sova", "Raze", "Viper"];

const clutches = ["1v1", "1v2", "1v3", "1v4", "1v5", "2v2", "2v3", "2v4", "2v5"]

export default function ClutchItem() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clutchType, setClutchType] = useState("1v1");
  const [players, setPlayers] = useState<string[]>(["", ""]);
  const [cloveSmokesTeamA, setCloveSmokesTeamA] = useState(false);
  const [cloveSmokesTeamB, setCloveSmokesTeamB] = useState(false);
  const [winner, setWinner] = useState<"A" | "B">("A");
  const [teamInClutch, setTeamInClutch] = useState<"A" | "B">("A");

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      setDialogOpen(true);
    }
  };

  const handleAgentChange = (index: number, agent: string) => {
    const newPlayers = [...players];
    newPlayers[index] = agent;
    setPlayers(newPlayers);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <li
          className="cursor-pointer border p-2 rounded bg-white"
          onClick={handleClick}
        >
          Clutch Item
        </li>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogTitle>Clutch Info</DialogTitle>
        <DialogDescription>Enter details about the clutch round.</DialogDescription>

        <div className="flex items-center justify-between">
            <label>In Clutch: Team {teamInClutch}</label>
            <Switch
              checked={teamInClutch === "B"}
              onCheckedChange={(val) => setTeamInClutch(val ? "B" : "A")}
            />
          </div>

        <div className="space-y-4 text-black">
          <div>
            <label className="block mb-1 font-medium">Clutch Type</label>
            <select
              value={clutchType}
              onChange={(e) => {
                const newType = e.target.value;
                setClutchType(newType);
                setPlayers(new Array(parseInt(newType[0])).fill(""));
              }}
              className="border p-2 rounded w-full"
            >
              {clutches.map(x => (<option value={x}>x</option>))}
            </select>
          </div>

        <DragAndDropList allowDuplicates={true} hasClutchItem={false}/>
          

          {players.map((agent, index) => (
            <div key={index}>
              <label className="block mb-1">Agent {index + 1}</label>
              <select
                value={agent}
                onChange={(e) => handleAgentChange(index, e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select agent</option>
                {agents.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <label>Clove Smokes Available Team A</label>
            <Switch
              checked={cloveSmokesTeamA}
              onCheckedChange={setCloveSmokesTeamA}
            />
          </div>

          <div className="flex items-center justify-between">
            <label>Clove Smokes Available Team B</label>
            <Switch
              checked={cloveSmokesTeamB}
              onCheckedChange={setCloveSmokesTeamB}
            />
          </div>

          <div className="flex items-center justify-between">
            <label>Winner: Team {winner}</label>
            <Switch
              checked={winner === "B"}
              onCheckedChange={(val) => setWinner(val ? "B" : "A")}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
