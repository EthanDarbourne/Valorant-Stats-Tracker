import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import AddGamePage from "./AddGamePage";
import AddTournaments from "./AddTournamentsPage";
import EditTournament from './EditTournamentPage';

// Inside Routes
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/add-game" element={<AddGamePage />} />
      <Route path="/add-tournaments" element={<AddTournaments />} />
      
      <Route path="/edit-tournament/:id" element={<EditTournament />} />
    </Routes>
  );
}