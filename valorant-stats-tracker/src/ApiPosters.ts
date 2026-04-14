import { PORT } from "./Constants";
import { EntireTournament, EntireTournamentSchema } from "../../shared/TournamentSchema";
import { TournamentResultArray } from "../../shared/TournamentResultsSchema";
import { OtherMap, TournamentMap } from "../../shared/EntireGameSchema";
import {
    PostPlayerRoute,
    PostTeamRoute,
    PostTournamentResultsRoute,
    PostTournamentMap,
    PostOtherMap,
    PostTournamentRoute,
    PostTags,
    PostNotes,
} from "../../shared/ApiRoutes";
import { Team } from "../../shared/TeamSchema";
import { Player } from "../../shared/PlayerSchema";
import { Note, Tag } from "../../shared/NotesSchema";

export async function createTournament(tournament: EntireTournament) {
    const parsed = EntireTournamentSchema.safeParse(tournament);
    if (!parsed.success) {
        console.error("Invalid tournament object:", parsed.error);
        throw new Error("Invalid tournament data");
    }
    console.log("Sending ", parsed.data);
    const response = await fetch(`http://localhost:${PORT}${PostTournamentRoute}`, {
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

export async function updateTournamentGame(game: TournamentMap) {
    const response = await fetch(`http://localhost:${PORT}${PostTournamentMap}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(game),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to post tournament game: ${response.status} ${errorText}`);
    }

    return response;
}

export async function updateOtherGame(game: OtherMap) {
    const response = await fetch(`http://localhost:${PORT}${PostOtherMap}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(game),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to post other game: ${response.status} ${errorText}`);
    }

    return response;
}

export async function saveNotes(notes: Note[]) {
    const response = await fetch(`http://localhost:${PORT}${PostNotes}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(notes),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to post notes: ${response.status} ${errorText}`);
    }

    return response;
}

export async function saveTags(tags: Tag[]) {
    const response = await fetch(`http://localhost:${PORT}${PostTags}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tags),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to post tags: ${response.status} ${errorText}`);
    }

    return response;
}