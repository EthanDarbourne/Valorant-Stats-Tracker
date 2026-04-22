import { useEffect, useState } from "react";
import { FetchMapsInRotationRoute, FetchTeamsByRegionRoute, FetchTeamsByTournamentIdRoute, FetchAllTournamentsRoute, FetchTournamentByIdRoute, FetchAllPlayersWithoutTeams, FetchAgentsRoute, FetchAgentsByRoleRoute, FetchTeamsByTeamNameRoute, FetchAllNotes, FetchAllTags, FetchMatchesByTournamentIdRoute, FetchAllMapsRoute, FetchAgentRoles } from '../../shared/ApiRoutes';
import { DefaultTournament, TournamentInfo, EntireTournament, EntireTournamentSchema, TournamentInfoArraySchema } from "../../shared/TournamentSchema";
import { TeamArray, TeamArraySchema } from "../../shared/TeamSchema";
import { PlayerArray, PlayerArraySchema } from "../../shared/PlayerSchema";
import { TournamentMatchArraySchema, TournamentMatchArray } from "../../shared/TournamentMatchSchema";
import { PORT, Regions } from "./Constants";
import { Note, Tag } from "../../shared/NotesSchema";
import { TagCategory } from "./ValorantNotesPage";
import { Map, MapSchema } from "../../shared/AssetSchema";

export function useMapsInRotation() {
    const [maps, setMaps] = useState<string[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchMapsInRotationRoute}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch maps in rotation");
            return res.json();
        })
        .then((data) => {
            const mapNames = data.map((item: { Name: string }) => item.Name);
            setMaps(mapNames);
        })
        .catch((err) => console.error(err))
    }, []);

    return maps;
}

export function useAllMaps() {
    const [maps, setMaps] = useState<Map[]>([]);

    const fetchMaps = () => {
        fetch(`http://localhost:${PORT}${FetchAllMapsRoute}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch maps");
            return res.json();
        })
        .then((data) => {
            const maps = data.map(MapSchema.parse);
            setMaps(maps);
        })
        .catch((err) => console.error(err))
    };

    useEffect(() => {
        fetchMaps();
    }, []);

    return [maps, fetchMaps] as const;
}

export function useRoles() {
    const [roles, setRoles] = useState<string[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchAgentRoles}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch roles");
            return res.json();
        })
        .then((data) => {
            const roleNames = data.map((item: { Role: string }) => item.Role);
            setRoles(roleNames);
        })
        .catch((err) => console.error(err))
    }, []);

    return roles;
}

export function useTeamsByRegion(region: Regions) {
    const [teams, setTeams] = useState<TeamArray>([]);
    const fetchTeams = async () => {
        await fetch(`http://localhost:${PORT}${FetchTeamsByRegionRoute}?Region=${encodeURIComponent(Regions[region].toString())}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch teams by region");
                return res.json();
            })
            .then((data) => {
                const teamArray = TeamArraySchema.parse(data);
                teamArray.sort((a, b) => a.Name.localeCompare(b.Name));
                setTeams(teamArray);
            })
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchTeams();
    }, [region]);

    return [teams, fetchTeams] as const;
}

export function usePlayersWithoutTeams() {
    const [players, setPlayers] = useState<PlayerArray>([]);
    const fetchPlayers = async () => {
        await fetch(`http://localhost:${PORT}${FetchAllPlayersWithoutTeams}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch players without teams");
                return res.json();
            })
            .then((data) => {
                const playerArray = PlayerArraySchema.parse(data);
                playerArray.sort((a, b) => a.Name.localeCompare(b.Name));
                console.log("Players without teams:", playerArray);
                setPlayers(playerArray);
            })
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    return [players, fetchPlayers] as const;
}

export function useAllTeamsByRegions(regions: Regions[]) {
  const [teamsByRegion, setTeamsByRegion] = useState<Record<string, string[]>>({});

  // Populate each region’s teams using the useTeamsByRegion hook
  const allTeams = regions.reduce((acc, region) => {
    const [teams, _] = useTeamsByRegion(region); // returns a list of strings (React state)
    acc[region] = teams.map(x => x.Name);
    return acc;
  }, {} as Record<string, string[]>);

  useEffect(() => {
    setTeamsByRegion(allTeams);
  }, [JSON.stringify(allTeams)]); // triggers on any change in teams

  return teamsByRegion;
}

export function useTeamsByTournamentId(tournamentId: number) {
    const [teams, setTeams] = useState<TeamArray>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchTeamsByTournamentIdRoute}?TournamentId=${encodeURIComponent(tournamentId)}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch teams by tournament");
            return res.json();
        })
        .then((data) => {
            const teams = TeamArraySchema.parse(data);
            setTeams(teams);
        })
        .catch((err) => console.error(err))
    }, [tournamentId]);

    return teams;
}

export function useTeamsByTeamName(teamNames: string[]) {
    const [teams, setTeams] = useState<TeamArray>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchTeamsByTeamNameRoute}?Teams=${encodeURIComponent(teamNames.join(','))}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch teams by tournament");
            return res.json();
        })
        .then((data) => {
            const teams = TeamArraySchema.parse(data);
            setTeams(teams);
        })
        .catch((err) => console.error(err))
    }, [teamNames]);

    return teams;
}

export function useTournaments() {
    const [tournaments, setTournaments] = useState<TournamentInfo[]>([]);
    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchAllTournamentsRoute}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch tournaments");
            return res.json();
        })
        .then((data) => {
            const result = TournamentInfoArraySchema.safeParse(data);
            if (result.success) {
                data = result.data//FixDatesInArray(result.data);
                setTournaments(data);
            } else {
                console.error("Validation failed:", result.error);
            }
        })
        .catch((err) => console.error(err))
    }, []);
    return [tournaments, setTournaments] as const;

}

export function useTournamentById(id: number) {
    const [tournament, setTournament] = useState<EntireTournament>(DefaultTournament);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchTournamentByIdRoute}?TournamentId=${encodeURIComponent(id.toString())}`)
        .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch tournament with id ${id}`);
            return res.json();
        })
        .then((data) => {
            const result = EntireTournamentSchema.safeParse(data);
            if (result.success) {
                // data = FixDates(result.data);
                setTournament(result.data);
            } else {
                console.error("Validation failed:", result.error);
            }
        })
        .catch((err) => console.error(err))
    }, []);

    return [tournament, setTournament] as const;
}

export function useTournamentMatchesById(tournamentId: number) {
    const [games, setGames] = useState<TournamentMatchArray>([]);
    useEffect(() => {
        if(tournamentId < 0) return;
        fetch(`http://localhost:${PORT}${FetchMatchesByTournamentIdRoute}?TournamentId=${encodeURIComponent(tournamentId.toString())}`)
        .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch tournament games with id ${tournamentId}`);
            return res.json();
        })
        .then((data) => {
            const result = TournamentMatchArraySchema.safeParse(data);
            if (result.success) {
                setGames(result.data);
            } else {
                console.error("Validation failed:", result.error);
            }
        })
        .catch((err) => console.error(err))
    }, [tournamentId]);


    return [games, setGames] as const;
}

export function useAgents() {
    const [agents, setAgents] = useState<string[]>([]);

    const fetchAgents = () => {
        fetch(`http://localhost:${PORT}${FetchAgentsRoute}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch agents");
            return res.json();
        })
        .then((data) => {
            const agentNames = data.map((item: { Name: string }) => item.Name);
            setAgents(agentNames);
        })
        .catch((err) => console.error(err))
    }

    useEffect(() => {
        fetchAgents();
    }, []);

    return [agents, fetchAgents] as const;
}

export function useAgentsByRole(role: string) {
    const [agents, setAgents] = useState<string[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchAgentsByRoleRoute}?Role=${encodeURIComponent(role)}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch agents by role");
            return res.json();
        })
        .then((data) => {
            const agentNames = data.map((item: { Name: string }) => item.Name);
            setAgents(agentNames);
        })
        .catch((err) => console.error(err))
    }, [role]);

    return agents;
}

export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchAllNotes}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch notes");
            return res.json();
        })
        .then((data) => {
            setNotes(data);
        })
        .catch((err) => console.error(err))
    }, []);

    return [notes, setNotes] as const;
}

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchAllTags}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch tags");
            return res.json();
        })
        .then((data) => {
            setTags(data);
        })
        .catch((err) => console.error(err))
    }, []);

    return [tags, setTags] as const;
}

export function useTagsByCategory() {
    const [tags, setTags] = useState<TagCategory[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchAllTags}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch tags");
            return res.json();
        })
        .then((data: Tag[]) => {
            const grouped = data.reduce((acc, { Category, Name }) => {
                (acc[Category] ||= []).push(Name);
                return acc;
            }, {} as Record<string, string[]>);

            const groupedTags = Object.entries(grouped).map(([Category, Tags]) => ({
                Category,
                Tags
            }));
            setTags([...tags, ...groupedTags]);
        })
        .catch((err) => console.error(err))
    }, []);

    return [tags, setTags] as const;
}