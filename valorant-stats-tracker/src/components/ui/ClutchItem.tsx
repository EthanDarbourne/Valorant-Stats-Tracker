import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const agents = ["Jett", "Clove", "Sova", "Raze", "Viper"];

export default function ClutchItem() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clutchType, setClutchType] = useState("1v1");
  const [players, setPlayers] = useState<string[]>(["", ""]);
  const [cloveSmokes, setCloveSmokes] = useState(false);
  const [winner, setWinner] = useState<"A" | "B">("A");

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
      <DialogContent>
        <DialogTitle>Clutch Info</DialogTitle>
        <DialogDescription>Enter details about the clutch round.</DialogDescription>

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
              <option value="1v1">1v1</option>
              <option value="2v2">2v2</option>
            </select>
          </div>

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
            <label>Clove Smokes Available</label>
            <Switch
              checked={cloveSmokes}
              onCheckedChange={setCloveSmokes}
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
