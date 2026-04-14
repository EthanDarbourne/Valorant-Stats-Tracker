import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import AddGamePage from "./AddGamePage";
import AddTournaments from "./ViewTournamentsPage";
import EditTeamPage from "./EditTeamPage";
import CreateTournamentPage from "./CreateTournamentPage";
import EditTournamentPage from "./EditTournamentPage";
import ValorantNotes from "./ValorantNotesPage";

// Inside Routes
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/add-game" element={<AddGamePage />} />
      <Route path="/add-tournaments" element={<AddTournaments />} />
      <Route path="/create-tournament" element={<CreateTournamentPage />} />
      
      <Route path="/edit-tournament/:id" element={<EditTournamentPage />} />
      <Route path="/notes" element={<ValorantNotes />} />


      <Route path="/edit-teams" element={<EditTeamPage />} />
    </Routes>
  );
}