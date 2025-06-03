import React, { useEffect, useMemo, useState } from 'react';
import HomeButton from './components/ui/HomeButton';
import { useNavigate } from 'react-router-dom';
import { usePlayersWithoutTeams, useTeamsByRegion } from './ApiCallers';
import { RegionList, Regions, roles } from './Constants';
import { Team } from '../../shared/TeamSchema';
import { updateTeam } from './ApiPosters';
import AddPlayerWithoutTeamDialog from './components/ui/AddPlayerWithoutTeamDialog';
import { getButtonClass } from './Utilities';

type PlayerInput = {
    foundPlayer: boolean;
    id: number;
    name: string;
    isIGL: boolean;
};

export default function TeamEditPage() {
    const [selectedTeamId, setSelectedTeamId] = useState<number>(0);
    const [players, setPlayers] = useState<PlayerInput[]>(
        roles.map(() => ({ foundPlayer: false, id: -1, name: '', isIGL: false }))
    );
    const [region, setRegion] = useState<Regions>(Regions.AMER);
    const [newRegion, setNewRegion] = useState<Regions>(Regions.AMER);

    const [teams, fetchTeams] = useTeamsByRegion(region);
    const allPlayers = useMemo(() => {
        return teams.flatMap(team => team.Players);
    }, [teams]);

    const [playersWithoutTeams, fetchPlayersWithoutTeams ]= usePlayersWithoutTeams();

    const handleRegionChange = (region: Regions) => {
        setRegion(region);
        setSelectedTeamId(0);
    }

    const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const teamId = Number(e.target.value);
        setSelectedTeamId(teamId);
        // Here you'd typically fetch team data to populate the form
        const teamPlayers = allPlayers.filter(x => x.TeamId == teamId);
        setPlayers(roles.map(role => {
            const player = teamPlayers.find(x => x.Role == role && x.TeamId == teamId);
            return ({ foundPlayer: player != undefined, id: player?.Id ?? -1, name: player?.Name ?? "", isIGL: player?.IGL ?? false })
        }));
        setNewRegion(region);
    };

    const findPlayer = (name: string) => {
        const player = allPlayers.find(x => x.Name === name);
        if (player !== undefined) return player;
        return playersWithoutTeams.find(x => x.Name === name);
    }

    const handlePlayerChange = (index: number, key: keyof PlayerInput, value: any) => {
        const updated = [...players];
        if (key === 'isIGL') {
            updated.forEach((_, i) => (updated[i].isIGL = i === index));
        } else if (key === 'name') {
            const newName = value as string;
            const match = findPlayer(newName);
            if(match) {
                updated[index]['id'] = match.Id;
            }
            updated[index]['foundPlayer'] = match !== undefined;
            updated[index][key] = newName;
        } else if (key === 'foundPlayer') {
            updated[index][key] = false;
            updated[index]['id'] = -1
            updated[index]['name'] = ""
            updated[index]['isIGL'] = false
        }
        setPlayers(updated);
    };
    const navigate = useNavigate();

    useEffect(() => {
        const updated = players.map(player => ({
            ...player,
            foundPlayer: true,
            id: player.id < 0
                ? findPlayer(player.name)?.Id ?? -1
                : player.id
        }));
        setPlayers(updated);
    }, [teams, allPlayers, playersWithoutTeams]);

    const save = async () => {
        const prevTeam = teams.find(x => x.Id == selectedTeamId)!;
        const team: Team = ({
            Id: selectedTeamId,
            Name: prevTeam.Name,
            Region: newRegion,
            Players: players.map((x, roleIdx) => ({
                Id: x.foundPlayer ? x.id : -1,
                TeamId: selectedTeamId,
                Name: x.name,
                Role: roles[roleIdx],
                IGL: x.isIGL,
            })).filter(x => x.Name !== "")
        });
        await updateTeam(team)
        
        await fetchTeams();
        await fetchPlayersWithoutTeams();
    }
  
    const goBack = () => navigate("/add-tournaments");

    function stringToRegion(regionStr: string): Regions {
        if (regionStr in Regions) {
            return Regions[regionStr as keyof typeof Regions];
        }
        throw new Error(regionStr + " is not a region");
    }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Edit Team</h1>
        <select
              className="block w-full border rounded p-2 mt-1"
              value={region}
              onChange={(e) => {handleRegionChange(stringToRegion(e.target.value)); setNewRegion(stringToRegion(e.target.value))}}
            >
              {RegionList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
        </select>
      <label className="block">
        Select Team:
        <select
          className="block w-full border rounded p-2 mt-1"
          value={selectedTeamId}
          onChange={handleTeamChange}
        >
          <option value="">-- Select --</option>
          {teams.map((team) => (
            <option key={team.Id} value={team.Id}>
              {team.Name}
            </option>
          ))}
        </select>
      </label>

      {selectedTeamId > 0 && (
        <>
          <div className="space-y-2">
            {roles.map((role, i) => (
              <div key={role} className="flex items-center gap-2">
                <label className="w-20">{role}:</label>
                <input
                  type="text"
                  value={players[i].name}
                  onChange={(e) => handlePlayerChange(i, 'name', e.target.value)}
                  className="flex-1 border rounded p-1"
                  tabIndex={i + 1}
                />
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={players[i].isIGL}
                    onChange={() => handlePlayerChange(i, 'isIGL', true)}
                  />
                  IGL
                </label>
                <button
                    disabled={!players[i].foundPlayer}
                    className="w-8 h-8 flex items-center justify-center text-xl font-bold text-gray-600 
                                hover:text-white hover:bg-red-500 
                                disabled:hover:bg-transparent disabled:hover:text-gray-400 
                                rounded-full focus:outline-none"
                    onClick={() => handlePlayerChange(i, 'foundPlayer', false)}>
                    &times;
                </button>
              </div>
            ))}
          </div>

          <label className="block mt-4">
            New Region:
            <select
              className="block w-full border rounded p-2 mt-1"
              value={newRegion}
              onChange={(e) => setNewRegion(stringToRegion(e.target.value))}
            >
              {RegionList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
        <div className="mt-6 flex items-center space-x-4">
            {AddPlayerWithoutTeamDialog()}
            <button onClick={_ => save()} 
                className={"flex items-center gap-2 " + getButtonClass({
                    bg: "bg-green-500", text: "text-white", hoverBg: "bg-green-600", rounded: true, padding: "px-4 py-2", transition: true
                    })}>
                Save
            </button>
            <button onClick={_ => goBack()}
                className={"flex items-center gap-2 " + getButtonClass({
                    bg: "bg-white-500", text: "text-black", hoverBg: "bg-white-600", rounded: true, padding: "px-4 py-2", transition: true
                    })}>
                Go Back
            </button>
            <HomeButton />
        </div>
    </div>
  );
}
