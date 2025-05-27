import { Router, Request, Response } from 'express';
import { GetAllTournaments, GetTournamentById, InsertTournament, UpdateTournament } from '../TableSchemas/TournamentsTable';
import { TeamInfo, TournamentSchema } from "../../../shared/TournamentSchema"
import { TournamentResultArraySchema } from "../../../shared/TournamentResultsSchema";
import { DeleteResultsForTournamentId, GetTeamsByTournamentId, InsertTournamentResult, UpdatePlacement } from '../TableSchemas/TournamentResultsTable';
import { DeleteAllTournamentGames } from '../TableSchemas/TournamentGamesTable';
import { SelectTeamIdsByName, SelectTeamNameByIds } from '../TableSchemas/TeamsTable';
import { MakeCallWithDatabaseResult, RESPONSE_OK, RESPONSE_INTERNAL_ERROR, SetResponse, RESPONSE_CREATED, RESPONSE_BAD_REQUEST } from '../Helpers';

const router = Router();

router.get('/api/tournaments', async (req: Request, res: Response) => {
    await MakeCallWithDatabaseResult(async () => await GetAllTournaments(), res, "GetAllTournaments");
});

router.get('/api/tournamentById', async (req: Request, res: Response) => {
    try {
        const id = Number(req.query.id as string);
        const tournament = await GetTournamentById(id);

        const teamsById = await GetTeamsByTournamentId(id);

        const teamNames = await SelectTeamNameByIds(teamsById.map(x => x.TeamId));
        const teams = teamsById.map(r => (
            { Name: teamNames.find(x => x.Id == r.TeamId)?.Name, Placement: r.Placement }));
        // todo: log if didn't find id
        const fullTournament = {
            ...tournament,
            Teams: teams,
        };

        const parsed = TournamentSchema.safeParse(fullTournament);
        if (!parsed.success) {
            throw new Error(`Validation failed: ${parsed.error.message}`);
        }
        SetResponse(res, RESPONSE_OK, parsed.data);
    }
    catch (error) {
        console.log(error);
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { Error: "Error fetching from database by tournament Id " + req.query.id });
    }

});


async function UpdateTournamentResults(tournamentId: number, teamNames: TeamInfo[]): Promise<void> {
  if (!Number.isInteger(tournamentId)) {
    throw new Error("Invalid TournamentId");
  }

  // Step 1: Delete previous results
  await DeleteResultsForTournamentId(tournamentId);

  // Step 2: Insert new results
  const teams = await SelectTeamIdsByName(teamNames.map(x => x.Name));

  for (const team of teamNames) {
    const teamId = teams.find(x => x.Name == team.Name)?.Id;
    if(teamId) {
        await InsertTournamentResult( {
          TournamentId: tournamentId,
          TeamId: teamId,
          Placement: team.Placement
        });
    }
    else {
        console.log("Couldn't find team id for team " + team.Name);
    }
  }

  console.log(`TournamentResults updated for TournamentId ${tournamentId}`);
}

router.post("/api/saveTournament", async (req: Request, res: Response) => {
  const parsed = TournamentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(RESPONSE_BAD_REQUEST).json({ error: "Invalid tournament data", details: parsed.error.errors });
    return;
  }

  try {
    const tournamentDataWithWinner = { ...parsed.data, Winner: null };
    if(parsed.data.Id < 0) {
      const { Teams, ...tournamentDataWithoutTeams  } = tournamentDataWithWinner; // id is serial and doesn't need to be inserted
      parsed.data.Id = await InsertTournament(tournamentDataWithoutTeams);
    }
    else {
      const { Teams, ...tournamentDataWithoutTeams } = tournamentDataWithWinner;
      await UpdateTournament(tournamentDataWithoutTeams);
    }
    await UpdateTournamentResults(parsed.data.Id, parsed.data.Teams);

    res.status(RESPONSE_CREATED).json({ message: "Tournament created successfully" , Id: parsed.data.Id });
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_INTERNAL_ERROR).json({ error: "Failed to insert tournament into database" });
  }
});

router.post("/api/saveTournamentResults", async (req: Request, res: Response) => {
  const parsed = TournamentResultArraySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(RESPONSE_BAD_REQUEST).json({ error: "Invalid tournament data", details: parsed.error.errors });
    return;
  }


  try {
    const tournamentId = parsed.data.TournamentId;
    const results = parsed.data.Results;

    const teamNames = results.map(x => x.Name)
    const teams = await SelectTeamIdsByName(teamNames);


    // Update placements of teams in tournament (rows should already exist)
    results.forEach(async res => {
      const id = teams.find(x => x.Name == res.Name)?.Id;
      if(id) {
        await UpdatePlacement({TournamentId: tournamentId, TeamId: id, Placement: res.Placement})
      }
      else {
        console.log("Couldn't find id for team " + res.Name);
      }
    });

    // Remove all games for tournament id
    await DeleteAllTournamentGames(tournamentId);

    // insert into table
    // await InsertTournamentGames();

    res.status(RESPONSE_CREATED).json({ message: "Tournament Results created successfully" , Id: parsed.data.TournamentId });
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_INTERNAL_ERROR).json({ error: "Failed to insert tournament into database" });
  }
});


export default router;
