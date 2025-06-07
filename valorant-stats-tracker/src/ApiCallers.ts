import { useEffect, useState } from "react";
import { FetchMapsRoute, FetchTeamsByRegionRoute, FetchTeamsByTournamentIdRoute, FetchAllTournamentsRoute, FetchTournamentByIdRoute, FetchGamesByTournamentIdRoute, FetchAllPlayersWithoutTeams, FetchAgentsRoute, FetchAgentsByRoleRoute } from '../../shared/ApiRoutes';
import { DefaultTournament, FixDates, TournamentInfo, TournamentArraySchema, EntireTournament, EntireTournamentSchema } from "../../shared/TournamentSchema";
import { GameArray, GameArraySchema } from "../../shared/GameSchema";
import { TeamArray, TeamArraySchema } from "../../shared/TeamSchema";
import { PlayerArray, PlayerArraySchema } from "../../shared/PlayerSchema";
import { PORT, Regions } from "./Constants";

export function useMaps() {
    const [maps, setMaps] = useState<string[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}${FetchMapsRoute}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch maps");
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

    return [teams, setTeams] as const;
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
            const result = TournamentArraySchema.safeParse(data);
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
                data = FixDates(result.data);
                setTournament(data);
            } else {
                console.error("Validation failed:", result.error);
            }
        })
        .catch((err) => console.error(err))
    }, []);

    return [tournament, setTournament] as const;
}

export function useTournamentGamesById(tournamentId: number) {
    const [games, setGames] = useState<GameArray>([]);
    useEffect(() => {
        if(tournamentId < 0)return;
        fetch(`http://localhost:${PORT}${FetchGamesByTournamentIdRoute}?TournamentId=${encodeURIComponent(tournamentId.toString())}`)
        .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch tournament games with id ${tournamentId}`);
            return res.json();
        })
        .then((data) => {
            const result = GameArraySchema.safeParse(data);
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

    useEffect(() => {
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
    }, []);

    return agents;
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