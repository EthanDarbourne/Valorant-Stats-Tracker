

// URL parameters: None
// Request Body: None
// Returns: Array(string)
export const FetchMapsRoute = "api/maps"

// URL parameters: None
// Request Body: None
// Returns: TournamentArray
export const FetchAllTournamentsRoute = "api/tournaments"

// URL parameters: TournamentId
// Request Body: None
// Returns: Tournament
export const FetchTournamentsByIdRoute = "api/tournamentById"

// URL parameters: Region
// Request Body: None
// Returns: TeamArray
export const FetchTeamsByRegionRoute = "api/teamsByRegion"

// URL parameters: TournamentId
// Request Body: None
// Returns: TeamArray
export const FetchTeamsByTournamentIdRoute = "api/teamsByTournamentId"

// URL parameters: TournamentId
// Request Body: None
// Returns: GameArray
export const FetchGamesByTournamentIdRoute = "api/gamesByTournamentId"

// URL parameters: None
// Request Body: Tournament
// Returns: None
export const PostTournamentRoute = "api/saveTournament"

// URL parameters: None
// Request Body: TournamentResultArray
// Returns: None
export const PostTournamentResultsRoute = "api/saveTournamentResults"

// URL parameters: TournamentId
// Request Body: None
// Returns: None
export const DeleteTournamentRoute = "api/deleteTournament"