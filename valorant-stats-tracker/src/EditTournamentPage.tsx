import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAllTeamsByRegions, useTournamentById } from './ApiCallers';
import { Tournament } from '../../shared/TournamentSchema';
import { updateTournament } from './ApiPosters';
import { RegionList } from './Constants';

const EditTournamentPage = () => {
  const { id } = useParams<{ id: string }>();

  const [teamSelections, setTeamSelections] = useState<string[][]>([[], [], [], []]);
  
  const teamsByRegion = useAllTeamsByRegions(RegionList);

  const [tournament, setTournament] = useState<Tournament>({
      Id: -1,
      Name: "",
      Location: "",
      StartDate: "",
      EndDate: "",
      Completed: false,
      Teams: []
    },);

    useEffect(() => {
      if (!tournament?.Teams) return;

      const selectedTeams = tournament.Teams;

      const allRegionsLoaded = RegionList.every(region =>
        Array.isArray(teamsByRegion[region])
      );

      if (!allRegionsLoaded) return;

      const newSelections = RegionList.map(region => {
        const regionTeams = teamsByRegion[region] || [];
        return regionTeams.filter(team => selectedTeams.map(x => x.Name).includes(team));
      });

      setTeamSelections(newSelections);
    }, [teamsByRegion, tournament]);

  useTournamentById(Number(id), setTournament);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setTournament((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value
    }));
  };

  const handleTeamSelect = (dropdownIndex: number, team: string) => {
    setTeamSelections((prev) => {
      const current = [...prev];
      const set = new Set(current[dropdownIndex]);
      if (set.has(team)) {
        set.delete(team);
      } else {
        set.add(team);
      }
      current[dropdownIndex] = Array.from(set);
      return current;
    });
  };

    const navigate = useNavigate();

  const save = async () => {
    tournament.Teams = teamSelections.flat().map(name => ({
      Name: name,
      Placement: null,
    }));
    await updateTournament(tournament);
    goBack()
  }

  const goBack = () => navigate("/add-tournaments");

  const allSelectedTeams = Array.from(new Set(teamSelections.flat()));

  return (
    <div className="p-6 w-full">
      <h2 className="text-2xl font-bold mb-4">Edit Tournament: {tournament.Name}</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <input
          name="Name"
          value={tournament.Name}
          onChange={handleInputChange}
          placeholder="Tournament Name"
          className="border rounded p-2 text-black"
        />
        <input
          name="Location"
          value={tournament.Location}
          onChange={handleInputChange}
          placeholder="Location"
          className="border rounded p-2 text-black"
        />
        <input
          type="date"
          name="StartDate"
          value={tournament.StartDate}
          onChange={handleInputChange}
          className="border rounded p-2 text-black"
        />
        <input
          type="date"
          name="EndDate"
          value={tournament.EndDate}
          onChange={handleInputChange}
          className="border rounded p-2 text-black"
        />
        <label className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            name="Completed"
            checked={tournament.Completed}
            onChange={handleInputChange}
          />
          Completed
        </label>
      </div>

      <h3 className="text-xl font-semibold mb-2">Team Selection</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {RegionList.map((region, index) => (
          <div key={index} className="border p-2 rounded">
            <h4 className="font-semibold mb-2">Dropdown {index + 1}</h4>
            {teamsByRegion[region]?.map((team) => (
              <div
                key={team}
                onClick={() => handleTeamSelect(index, team)}
                className={`cursor-pointer p-1 rounded ${
                  teamSelections[index].includes(team) ? "bg-blue-300" : "hover:bg-gray-100"
                }`}
              >
                {team}
              </div>
            ))}
          </div>
        ))}
      </div>

      <h4 className="font-medium mt-6 mb-2">All Selected Teams:</h4>
      <div className="flex flex-wrap gap-2">
        {allSelectedTeams.map((team) => (
          <span
            key={team}
            className="bg-blue-200 text-black px-3 py-1 rounded-full text-sm"
          >
            {team}
          </span>
        ))}
      </div>

      <button onClick={_ => save()} className="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Save Changes
      </button>
      <button onClick={_ => goBack()} className="mt-6 px-4 py-2 rounded">
        Go Back
      </button>
    </div>
  );
};

export default EditTournamentPage;
