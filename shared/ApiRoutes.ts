

// URL parameters: None
// Request Body: None
// Returns: Array(string)
export const FetchMapsRoute = "/api/maps"

// URL parameters: None
// Request Body: None
// Returns: TournamentArray
export const FetchAllTournamentsRoute = "/api/tournaments"

// URL parameters: TournamentId
// Request Body: None
// Returns: EntireTournament
export const FetchTournamentByIdRoute = "/api/tournamentById"

// URL parameters: Region
// Request Body: None
// Returns: TeamArray
export const FetchTeamsByRegionRoute = "/api/teamsByRegion"

// URL parameters: TournamentId
// Request Body: None
// Returns: TeamArray
export const FetchTeamsByTournamentIdRoute = "/api/teamsByTournamentId"

// URL parameters: TournamentId
// Request Body: None
// Returns: GameArray
export const FetchGamesByTournamentIdRoute = "/api/gamesByTournamentId"

// URL parameters: None
// Request Body: Tournament
// Returns: None
export const PostTournamentInfoRoute = "/api/saveTournament"

// URL parameters: None
// Request Body: TournamentResultArray
// Returns: None
export const PostTournamentResultsRoute = "/api/saveTournamentResults"

// URL parameters: None
// Request Body: Team
// Returns: None
export const PostTeamRoute = "/api/saveTeam"

// URL parameters: None
// Request Body: Player
// Returns: None
export const PostPlayerRoute = "/api/savePlayer"

// URL parameters: TournamentId
// Request Body: None
// Returns: None
export const DeleteTournamentRoute = "/api/deleteTournament"

// URL parameters: None
// Request Body: None
// Returns: PlayerArray
export const FetchAllPlayersWithoutTeams = "/api/playersWithoutTeams"

// URL parameters: None
// Request Body: None
// Returns: AgentArray
export const FetchAgentsRoute = "/api/agents"

// URL parameters: Role
// Request Body: None
// Returns: AgentArray
export const FetchAgentsByRoleRoute = "/api/agents"

// URL parameters: None
// Request Body: TournamentMap
// Returns: None
export const PostTournamentMap = "/api/saveTournamentMap"

// URL parameters: None
// Request Body: OtherMap
// Returns: None
export const PostOtherMap = "/api/saveOtherMap"