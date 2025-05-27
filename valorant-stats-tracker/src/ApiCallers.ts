import { useEffect, useState } from "react";
import { MAPSROUTE, PORT, Regions, TEAMSBYREGIONROUTE, TEAMSBYTOURNAMENTROUTE, TOURNAMENTSROUTE, TOURNAMENTSBYIDROUTE } from './Constants';
import { FixDates, TournamentArraySchema, TournamentSchema } from "../../shared/TournamentSchema";

export function useMaps() {
    const [maps, setMaps] = useState<string[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}/${MAPSROUTE}`)
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
    const [teams, setTeams] = useState<string[]>([]);
    useEffect(() => {
        fetch(`http://localhost:${PORT}/${TEAMSBYREGIONROUTE}?region=${encodeURIComponent(Regions[region].toString())}`)
        .then((res) => {
            
            if (!res.ok) throw new Error("Failed to fetch teams by region");
            return res.json();
        })
        .then((data) => {
            console.log("Fetched", data);
            const teamNames = data.map((item: { Name: string }) => item.Name);
            setTeams(teamNames);
        })
        .catch((err) => console.error(err))
    }, []);

    return teams;
}

export function useAllTeamsByRegions(regions: Regions[]) {
  const [teamsByRegion, setTeamsByRegion] = useState<Record<string, string[]>>({});

  // Populate each region’s teams using the useTeamsByRegion hook
  const allTeams = regions.reduce((acc, region) => {
    const teams = useTeamsByRegion(region); // returns a list of strings (React state)
    acc[region] = teams;
    return acc;
  }, {} as Record<string, string[]>);

  useEffect(() => {
    setTeamsByRegion(allTeams);
  }, [JSON.stringify(allTeams)]); // triggers on any change in teams

  return teamsByRegion;
}

export function useTeamsByTournamentId(tournamentId: number) {
    const [teams, setTeams] = useState<string[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}/${TEAMSBYTOURNAMENTROUTE}?tournamentId=${encodeURIComponent(tournamentId)}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch teams by tournament");
            return res.json();
        })
        .then((data) => {
            const teamNames = data.map((item: { Name: string }) => item.Name);
            setTeams(teamNames);
        })
        .catch((err) => console.error(err))
    }, []);

    return teams;
}

export function useTournaments(setTournaments: React.Dispatch<React.SetStateAction<any>>) {
    useEffect(() => {
        fetch(`http://localhost:${PORT}/${TOURNAMENTSROUTE}`)
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
}

export function useTournamentById(id: number, setTournament: React.Dispatch<React.SetStateAction<any>>) {
    // const [tournament, setTournament] = useState<Tournament | null>(null);

    useEffect(() => {
        fetch(`http://localhost:${PORT}/${TOURNAMENTSBYIDROUTE}?id=${encodeURIComponent(id.toString())}`)
        .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch tournament with id ${id}`);
            return res.json();
        })
        .then((data) => {
            const result = TournamentSchema.safeParse(data);
            if (result.success) {
                data = FixDates(result.data);
                setTournament(data);
            } else {
                console.error("Validation failed:", result.error);
            }
        })
        .catch((err) => console.error(err))
    }, []);

    // return tournament;
}