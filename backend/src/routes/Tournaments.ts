import { Router, Request, Response } from 'express';
import { GenerateSelectStatement, GetFromDatabase, SelectFromTableWhere } from '../Select';
import { InsertToDatabase, UpdateInDatabase } from "../Insert";
import { TournamentsTableSchema } from '../TableSchemas/TournamentsTable';
import { FixDates, TeamInfo, TournamentSchema } from "../../../shared/TournamentSchema"
import { TournamentResultArraySchema } from "../../../shared/TournamentResultsSchema";
import { DeleteFromTable } from '../Delete';
import { UpdatePlacement } from '../TableSchemas/TournamentResultsTable';
import { DeleteAllTournamentGames } from '../TableSchemas/TournamentGamesTable';
import { SelectTeamIdsByName } from '../TableSchemas/TeamsTable';

const router = Router();

router.get('/api/tournaments', async (req: Request, res: Response) => {

  const query = GenerateSelectStatement("Tournaments", TournamentsTableSchema.keyof().options);
  await GetFromDatabase(query, res);
});

router.get('/api/tournamentById', async (req: Request, res: Response) => {
  const id = Number(req.query.id as string);
  const queryResult = await SelectFromTableWhere("Tournaments", { Id: id });

  if(queryResult.length == 0) {
    res.status(400).json(`Tournament with Id ${id} not found`)
    return
  }

  const tournament = FixDates(queryResult[0]);

  const rows = await SelectFromTableWhere("TournamentResults", { TournamentId: id });

  const teams = rows.map(r => ({ Name: r.Team, Placement: r.Placement }));

  const fullTournament = {
    ...tournament,
    Teams: teams,
  };

  const parsed = TournamentSchema.safeParse(fullTournament);
  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.message}`);
  }

  res.status(201).json(parsed.data);
});


async function UpdateTournamentResults(tournamentId: number, teamNames: TeamInfo[]): Promise<void> {
  if (!Number.isInteger(tournamentId)) {
    throw new Error("Invalid TournamentId");
  }

  // Step 1: Delete previous results
  await DeleteFromTable("TournamentResults", {TournamentId: tournamentId});

  // Step 2: Insert new results using InsertToDatabase
  const teams = await SelectTeamIdsByName(teamNames.map(x => x.Name));

  for (const team of teamNames) {
    await InsertToDatabase("TournamentResults", {
      TournamentId: tournamentId,
      TeamId: teams.find(x => x.Name == team.Name)?.Id,
      Placement: team.Placement
    });
  }

  console.log(`TournamentResults updated for TournamentId ${tournamentId}`);
}

router.post("/api/saveTournament", async (req: Request, res: Response) => {
  const parsed = TournamentSchema.safeParse(req.body);

  console.log("Received: ", req.body, parsed);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid tournament data", details: parsed.error.errors });
    return;
  }

  try {
    if(parsed.data.Id < 0) {
      const { Id, Teams, ...tournamentDataWithoutIdAndTeams } = parsed.data; // id is serial and doesn't need to be inserted
      parsed.data.Id = await InsertToDatabase("Tournaments", tournamentDataWithoutIdAndTeams, "Id");
    }
    else {
      const { Teams, ...tournamentDataWithoutTeams } = parsed.data;
      await UpdateInDatabase("Tournaments", tournamentDataWithoutTeams);
    }
    await UpdateTournamentResults(parsed.data.Id, parsed.data.Teams);

    res.status(201).json({ message: "Tournament created successfully" , Id: parsed.data.Id });
  } catch (error) {
    res.status(500).json({ error: "Failed to insert tournament into database" });
  }
});

router.post("/api/saveTournamentResults", async (req: Request, res: Response) => {
  const parsed = TournamentResultArraySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid tournament data", details: parsed.error.errors });
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

    res.status(201).json({ message: "Tournament Results created successfully" , Id: parsed.data.TournamentId });
  } catch (error) {
    res.status(500).json({ error: "Failed to insert tournament into database" });
  }
});


export default router;
