import { useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { updateTournament } from "./ApiPosters";
import { TournamentInfo } from "../../shared/TournamentSchema";
import { useTournaments } from "./ApiCallers";
import { toInputDateString } from "../../shared/Helpers";
import HomeButton from './components/ui/HomeButton';

export default function TournamentsPage() {

    // inside your component
    const navigate = useNavigate();

  const nextId = useRef(-1);
  const handleAddTournament = () => {
    setTournaments([
      ...tournaments,
      {
        Id: nextId.current--,
        Name: "",
        Location: "",
        StartDate: toInputDateString(Date()),
        EndDate: toInputDateString(Date()),
        Completed: false,
        Teams: []
      },
    ]);
  };

  const [tournaments, setTournaments] = useTournaments();

  const handleRemoveTournament = (id: number) => {
    console.log("Delete tournament:", id);
    setTournaments(tournaments.filter((t) => t.Id !== id));
  };

  const handleChange = (
    id: number,
    field: keyof TournamentInfo,
    value: string | boolean
  ) => {
    setTournaments(
      tournaments.map((t) =>
        t.Id === id ? { ...t, [field]: value } : t
      )
    );
  };

  const handleSaveTournament = async (t: TournamentInfo) => {
    console.log("Save tournament:", t);
    t.Id = await updateTournament(t);
    console.log("Saved tournament with id:" + t.Id);
  };

  const handleSaveAll = () => {
    console.log("Save all tournaments:", tournaments);
    // TODO: Save all to backend
  };

  return (
    <div className="w-full p-4 space-y-4">
      <h1 className="text-2xl font-bold">Tournaments</h1>

      <div className="flex gap-4">
        <button
          onClick={handleAddTournament}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Tournament
        </button>
        <button
          onClick={handleSaveAll}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Save All
        </button>
      </div>

      <div className="flex flex-col h-screen p-0 m-0 overflow-x-auto">
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Location</th>
              <th className="border px-4 py-2">Start Date</th>
              <th className="border px-4 py-2">End Date</th>
              <th className="border px-4 py-2">Completed</th>
              <th className="border px-4 py-2">Edit Teams</th>
              <th className="border px-4 py-2">Edit Placements</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.Id} className="border">
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={t.Name}
                    onChange={(e) => handleChange(t.Id, "Name", e.target.value)}
                    className="border rounded p-1 w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={t.Location}
                    onChange={(e) => handleChange(t.Id, "Location", e.target.value)}
                    className="border rounded p-1 w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="date"
                    value={t.StartDate}
                    onChange={(e) => handleChange(t.Id, "StartDate", e.target.value)}
                    className="border rounded p-1 w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="date"
                    value={t.EndDate}
                    onChange={(e) => handleChange(t.Id, "EndDate", e.target.value)}
                    className="border rounded p-1 w-full"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={t.Completed}
                    onChange={(e) => handleChange(t.Id, "Completed", e.target.checked)}
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                    <button disabled={t.Id < 0} onClick={() => navigate(`/edit-tournament/${t.Id}`)}> {/* */}
                    Edit Teams
                    </button>
                </td>
                <td className="border px-2 py-1 text-center">
                    <button disabled={t.Id < 0} onClick={() => navigate(`/edit-tournament-results/${t.Id}`)}> {/* */}
                    Edit Placements
                    </button>
                </td>
                <td className="border px-2 py-1 text-center space-x-2">
                  <button
                    onClick={() => handleSaveTournament(t)}
                    className="text-green-600 hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleRemoveTournament(t.Id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {tournaments.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-4 text-gray-500">
                  No tournaments added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <HomeButton />
    </div>
  );
}
