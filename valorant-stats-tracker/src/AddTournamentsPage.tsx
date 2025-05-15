import { useState } from "react";
import { useNavigate } from 'react-router-dom';

type Tournament = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  completed: boolean;
  winner: string;
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

    // inside your component
    const navigate = useNavigate();

  const handleAddTournament = () => {
    setTournaments([
      ...tournaments,
      {
        id: -1,
        name: "",
        location: "",
        startDate: "",
        endDate: "",
        completed: false,
        winner: "",
      },
    ]);
  };

  const handleRemoveTournament = (id: number) => {
    console.log("Delete tournament:", id);
    setTournaments(tournaments.filter((t) => t.id !== id));
  };

  const handleChange = (
    id: number,
    field: keyof Tournament,
    value: string | boolean
  ) => {
    setTournaments(
      tournaments.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  };

  const handleSaveTournament = (id: number) => {
    const tournament = tournaments.find((t) => t.id === id);
    if (tournament) {
      console.log("Save tournament:", tournament);
      // TODO: Save to backend
    }
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
              <th className="border px-4 py-2">Winner</th>
              <th className="border px-4 py-2">Edit</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id} className="border">
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => handleChange(t.id, "name", e.target.value)}
                    className="border rounded p-1 w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={t.location}
                    onChange={(e) => handleChange(t.id, "location", e.target.value)}
                    className="border rounded p-1 w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="date"
                    value={t.startDate}
                    onChange={(e) => handleChange(t.id, "startDate", e.target.value)}
                    className="border rounded p-1 w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="date"
                    value={t.endDate}
                    onChange={(e) => handleChange(t.id, "endDate", e.target.value)}
                    className="border rounded p-1 w-full"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={(e) => handleChange(t.id, "completed", e.target.checked)}
                  />
                </td>
                <td className="border px-2 py-1">
                  <select
                    value={t.winner}
                    onChange={(e) => handleChange(t.id, "winner", e.target.value)}
                    className="border rounded p-1 w-full"
                  >
                    <option value="">-- Select Winner --</option>
                    {/* Replace with actual teams */}
                    <option value="Team A">Team A</option>
                    <option value="Team B">Team B</option>
                  </select>
                </td>
                <td>
                    <button onClick={() => navigate(`/edit-tournament/${t.id}`)}> {/*disabled={t.id == -1} */}
                    Edit Teams
                    </button>
                </td>
                <td className="border px-2 py-1 text-center space-x-2">
                  <button
                    onClick={() => handleSaveTournament(t.id)}
                    className="text-green-600 hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleRemoveTournament(t.id)}
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
    </div>
  );
}
