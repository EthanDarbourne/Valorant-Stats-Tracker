

export const PORT = 5000;



export const MAPSROUTE = "api/maps"
export const TOURNAMENTSROUTE = "api/tournaments"
export const TOURNAMENTSBYIDROUTE = "api/tournamentById"
export const TEAMSBYREGIONROUTE = "api/teamsByRegion"
export const TEAMSBYTOURNAMENTROUTE = "api/teamsByTournament"
export const SAVETOURNAMENTROUTE = "api/saveTournament"

export enum Regions {
    AMER,
    EMEA,
    APAC,
    CN
}

export const RegionList = [Regions.AMER, Regions.EMEA, Regions.APAC, Regions.CN]