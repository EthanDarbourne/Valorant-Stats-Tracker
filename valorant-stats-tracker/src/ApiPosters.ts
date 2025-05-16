import { Tournament, TournamentSchema } from "./types/TournamentSchema";




export async function updateTournament(tournament: Tournament) {
  // Validate the tournament object
  const parsed = TournamentSchema.safeParse(tournament);
  if (!parsed.success) {
    console.error("Invalid tournament object:", parsed.error);
    throw new Error("Invalid tournament data");
  }
  console.log("Sending ", parsed.data)
  const response = await fetch("/api/saveTournament", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parsed.data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to post tournament: ${response.status} ${errorText}`);
  }

  return await response.json();
}