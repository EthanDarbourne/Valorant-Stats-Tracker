// import React, { useState, ChangeEvent } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { useNavigate } from "react-router-dom";

// interface Game {
//   id: number;
//   date: string;
//   map: string;
//   agent: string;
//   kda: string;
//   result: string;
// }

// export default function ValorantStatsApp() {
//   const [games, setGames] = useState<Game[]>([]);
//   const navigate = useNavigate();

//   const handleDelete = (id: number) => {
//     setGames(games.filter((g) => g.id !== id));
//   };

//   const handleAddGame = () => {
//     navigate("/add-game");
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-4 space-y-4">
//       <h1 className="text-2xl font-bold">Valorant Stats Tracker</h1>

//       <Button onClick={handleAddGame}>Add New Game</Button>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {games.map((game) => (
//           <Card key={game.id}>
//             <CardContent className="p-4 space-y-1">
//               <p><strong>Date:</strong> {game.date}</p>
//               <p><strong>Map:</strong> {game.map}</p>
//               <p><strong>Agent:</strong> {game.agent}</p>
//               <p><strong>KDA:</strong> {game.kda}</p>
//               <p><strong>Result:</strong> {game.result}</p>
//               <Button variant="destructive" onClick={() => handleDelete(game.id)}>
//                 Delete
//               </Button>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// }

import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import AddGamePage from "./AddGamePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/add-game" element={<AddGamePage />} />
    </Routes>
  );
}