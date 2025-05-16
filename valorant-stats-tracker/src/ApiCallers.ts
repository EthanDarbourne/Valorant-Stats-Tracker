import { useEffect, useState } from "react";
import { MAPSROUTE, PORT, Regions, TEAMSBYREGIONROUTE, TEAMSBYTOURNAMENTROUTE, TOURNAMENTSROUTE, TOURNAMENTSBYIDROUTE } from './Constants';
import { Tournament, TournamentSchema } from "./types/TournamentSchema";

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
        fetch(`http://localhost:${PORT}/${TEAMSBYREGIONROUTE}?region=${encodeURIComponent(region.toString())}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch teams by region");
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

export function useTeamsByTournament(tournament: string) {
    const [teams, setTeams] = useState<string[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}/${TEAMSBYTOURNAMENTROUTE}?tournament=${encodeURIComponent(tournament)}`)
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

export function useTournaments() {
    const [maps, setMaps] = useState<string[]>([]);

    useEffect(() => {
        fetch(`http://localhost:${PORT}/${TOURNAMENTSROUTE}`)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch tournaments");
            return res.json();
        })
        .then((data) => {
            const names = data.map((item: { Name: string }) => item.Name);
            setMaps(names);
        })
        .catch((err) => console.error(err))
    }, []);

    return maps;
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
                setTournament(result.data); // ✅ Only set if valid
            } else {
                console.error("Validation failed:", result.error);
            }
        })
        .catch((err) => console.error(err))
    }, []);

    // return tournament;
}