import React, { useState } from 'react';
import HomeButton from './components/ui/HomeButton';
import { useNavigate } from 'react-router-dom';
import { useTeamsByRegion } from './ApiCallers';
import { RegionList, Regions } from './Constants';

const roles = ['Duelist', 'Flash', 'Scan', 'Senti', 'Flex'] as const;

type PlayerInput = {
  name: string;
  isIGL: boolean;
};



export default function TeamEditPage() {
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [players, setPlayers] = useState<PlayerInput[]>(
        roles.map(() => ({ name: '', isIGL: false }))
    );
    const [region, setRegion] = useState<Regions>(Regions.AMER);


    const teams = useTeamsByRegion(region);

    const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTeamId(e.target.value);
        // Here you'd typically fetch team data to populate the form
        setPlayers(roles.map(() => ({ name: '', isIGL: false })));
        setRegion(Regions.AMER);
    };

    const handlePlayerChange = (index: number, key: keyof PlayerInput, value: any) => {
        const updated = [...players];
        if (key === 'isIGL') {
            updated.forEach((_, i) => (updated[i].isIGL = i === index));
        } else {
            updated[index][key] = value;
        }
        setPlayers(updated);
    };
    const navigate = useNavigate();

   const save = async () => {
        //   tournament.Teams = teamSelections.flat().map(name => ({
        //     Name: name,
        //     Placement: null,
        //   }));
        //   await saveTeam(team);
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
              onChange={(e) => setRegion(stringToRegion(e.target.value))}
            >
              <option value="">-- Select Region --</option>
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

      {selectedTeamId && (
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
                />
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={players[i].isIGL}
                    onChange={() => handlePlayerChange(i, 'isIGL', true)}
                  />
                  IGL
                </label>
              </div>
            ))}
          </div>

          <label className="block mt-4">
            Region:
            <select
              className="block w-full border rounded p-2 mt-1"
              value={region}
              onChange={(e) => setRegion(stringToRegion(e.target.value))}
            >
              <option value="">-- Select Region --</option>
              {RegionList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
        <button onClick={_ => save()} className="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Save Changes
            </button>
            <button onClick={_ => goBack()} className="mt-6 px-4 py-2 rounded">
                Go Back
            </button>
        <HomeButton />
    </div>
  );
}
