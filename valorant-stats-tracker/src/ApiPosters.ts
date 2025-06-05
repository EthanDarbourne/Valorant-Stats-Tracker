import { PORT } from "./Constants";
import { TournamentInfo, TournamentInfoSchema } from "../../shared/TournamentSchema";
import { TournamentResultArray } from "../../shared/TournamentResultsSchema";
import { PostPlayerRoute, PostTeamRoute, PostTournamentResultsRoute, PostTournamentInfoRoute } from "../../shared/ApiRoutes";
import { Team } from "../../shared/TeamSchema";
import { Player } from "../../shared/PlayerSchema";

export async function updateTournament(tournament: TournamentInfo) {
  // Validate the tournament object
  const parsed = TournamentInfoSchema.safeParse(tournament);
  if (!parsed.success) {
    console.error("Invalid tournament object:", parsed.error);
    throw new Error("Invalid tournament data");
  }
  console.log("Sending ", parsed.data)
  const response = await fetch(`http://localhost:${PORT}${PostTournamentInfoRoute}`, {
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

export async function updateTournamentGamesAndPlacements(results: TournamentResultArray) {
  const response = await fetch(`http://localhost:${PORT}${PostTournamentResultsRoute}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(results),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to post tournament results: ${response.status} ${errorText}`);
  }

  return await response.json();
}

export async function updateTeam(team: Team) {
    const response = await fetch(`http://localhost:${PORT}${PostTeamRoute}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(team),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to post team: ${response.status} ${errorText}`);
  }

  return await response.json();
}

export async function updatePlayer(player: Player) {
    const response = await fetch(`http://localhost:${PORT}${PostPlayerRoute}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(player),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to post player: ${response.status} ${errorText}`);
  }

  return await response.json();
}