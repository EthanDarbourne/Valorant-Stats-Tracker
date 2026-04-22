

// URL parameters: None
// Request Body: None
// Returns: Array(string)
export const FetchMapsInRotationRoute = "/api/mapsInRotation"

// URL parameters: None
// Request Body: None
// Returns: Map[]
export const FetchAllMapsRoute = "/api/maps"

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

// URL parameters: Teams (comma seperated list of team names)
// Request Body: None
// Returns: TeamArray
export const FetchTeamsByTeamNameRoute = "/api/teamsByTeamName"

// URL parameters: TournamentId
// Request Body: None
// Returns: TeamArray
export const FetchTeamsByTournamentIdRoute = "/api/teamsByTournamentId"

// URL parameters: TournamentId
// Request Body: None
// Returns: TournamentMatchesArray
export const FetchMatchesByTournamentIdRoute = "/api/matchesByTournamentId"

// URL parameters: None
// Request Body: Tournament
// Returns: None
export const PostTournamentInfoRoute = "/api/saveTournament"

// URL parameters: None
// Request Body: TournamentResultArray
// Returns: None
export const PostTournamentResultsRoute = "/api/saveTournamentResults"

// URL parameters: None
// Request Body: EntireTournament
// Returns: None
export const PostTournamentRoute = "/api/createTournament"

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
export const FetchAgentsByRoleRoute = "/api/agentsByRole"

// URL parameters: None
// Request Body: None
// Returns: Array(string)
export const FetchAgentRoles = "/api/roles"

// URL parameters: None
// Request Body: TournamentMap
// Returns: None
export const PostTournamentMap = "/api/saveTournamentMap"

// URL parameters: None
// Request Body: OtherMap
// Returns: None
export const PostOtherMap = "/api/saveOtherMap"

// URL parameters: None
// Request Body: None
// Returns: NoteArray
export const FetchAllNotes = "/api/notes"

// URL parameters: None
// Request Body: NoteArray
// Returns: None
export const PostNotes = "/api/saveNotes"

// URL parameters: None
// Request Body: None
// Returns: TagArray
export const FetchAllTags = "/api/tags"

// URL parameters: TagArray
// Request Body: TagArray
// Returns: None
export const PostTags = "/api/saveTags"

// URL parameters: None
// Request Body: Map[]
// Returns: None
export const UpdateMaps = "/api/updateMaps"

// URL parameters: None
// Request Body: Agent
// Returns: None
export const PostAgent = "/api/saveAgent"