import { Router, Request, Response } from 'express';
import { DeleteTournament, GetAllTournaments, GetTournamentById, InsertTournament, SetTournamentWinner, UpdateTournament } from '../TableSchemas/TournamentsTable';
import { EntireTournamentSchema, TeamInfo, TournamentInfoSchema } from "../../../shared/TournamentSchema"
import { DeleteTournamentRoute, FetchAllTournamentsRoute, FetchTournamentByIdRoute, PostTournamentResultsRoute, PostTournamentInfoRoute } from "../../../shared/ApiRoutes"
import { TournamentResultArraySchema } from "../../../shared/TournamentResultsSchema";
import { DeleteResultsForTournamentId, GetTeamsByTournamentId, InsertTournamentResult, UpdatePlacement } from '../TableSchemas/TournamentResultsTable';
import { DeleteAllTournamentGames, GameInfo, InsertTournamentGames, SelectGamesByTournamentId } from '../TableSchemas/TournamentGamesTable';
import { SelectTeamIdsByName, SelectTeamNameByIds, TeamIdentity } from '../TableSchemas/TeamsTable';
import { MakeCallWithDatabaseResult, RESPONSE_OK, RESPONSE_INTERNAL_ERROR, SetResponse, RESPONSE_CREATED, RESPONSE_BAD_REQUEST, FindTeamName } from '../Helpers';
import pool from '../db';
import { QueryBuilder } from '../QueryBuilder';

const router = Router();

router.get(FetchAllTournamentsRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    try {
        await qb.Connect();
        await MakeCallWithDatabaseResult(async () => await GetAllTournaments(qb), res, "GetAllTournaments");
    }
    catch (error) {
        SetResponse(res, RESPONSE_INTERNAL_ERROR);
    }
    finally {
        qb.Disconnect();
    }
});

router.get(FetchTournamentByIdRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    try {
        await qb.Connect();
        const tournamentId = Number(req.query.TournamentId as string);
        const tournament = await GetTournamentById(qb, tournamentId);
        
        const teamsById = await GetTeamsByTournamentId(qb, tournamentId);
        
        const teamNames = await SelectTeamNameByIds(qb, teamsById.map(x => x.TeamId));
        const tournamentGames = await SelectGamesByTournamentId(qb, tournamentId);

        const teams = teamsById.map(r => (
            { 
                Id: r.TeamId,
                Name: teamNames.find(x => x.Id == r.TeamId)?.Name,
                Placement: r.Placement,
                Games: tournamentGames.filter(x => x.Team1Id == r.TeamId || x.Team2Id == r.TeamId)
                    .map(x => x.Team1Id !== r.TeamId 
                            ? FindTeamName(x.Team1Id, teamNames) 
                            : FindTeamName(x.Team2Id, teamNames)).map(x => x ? x : null)
                        }))
            // todo: log if didn't find id
        if(teams.some(x => x.Name == undefined)) {
            console.error("Some of the teams didn't find their name");
        }
        const fullTournament = {
            ...tournament,
            Teams: teams,
        };
        
        const parsed = EntireTournamentSchema.safeParse(fullTournament);
        if (!parsed.success) {
            throw new Error(`Validation failed: ${parsed.error.message}`);
        }
        SetResponse(res, RESPONSE_OK, parsed.data);
    }
    catch (error) {
        console.log(error);
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { Error: "Error fetching from database by tournament Id " + req.query.id });
    }
    finally {
        qb.Disconnect();
    }

});


async function UpdateTournamentResults(qb: QueryBuilder, tournamentId: number, teamNames: TeamInfo[]): Promise<void> {
      if (!Number.isInteger(tournamentId)) {
        throw new Error("Invalid TournamentId");
    }

    // Step 1: Delete previous results
    await DeleteResultsForTournamentId(qb, tournamentId);

    // Step 2: Insert new results
    const teams = await SelectTeamIdsByName(qb, teamNames.map(x => x.Name));

    for (const team of teamNames) {
        const teamId = teams.find(x => x.Name == team.Name)?.Id;
        if(teamId) {
            await InsertTournamentResult(qb, {
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

router.post(PostTournamentInfoRoute, async (req: Request, res: Response) => {
  
    const qb = new QueryBuilder(pool);
    const parsed = TournamentInfoSchema.safeParse(req.body);
    if (!parsed.success) {
        SetResponse(res, RESPONSE_BAD_REQUEST, { error: "Invalid tournament data", details: parsed.error.errors });
        return;
    }

    try {
        await qb.Connect();
        await qb.BeginTransaction();
        const tournamentDataWithWinner = { ...parsed.data, Winner: null };
        if(parsed.data.Id < 0) {
            const { Teams, ...tournamentDataWithoutTeams  } = tournamentDataWithWinner; // id is serial and doesn't need to be inserted
            parsed.data.Id = await InsertTournament(qb, tournamentDataWithoutTeams);
        }
        else {
            const { Teams, ...tournamentDataWithoutTeams } = tournamentDataWithWinner;
            await UpdateTournament(qb, tournamentDataWithoutTeams);
        }
        await UpdateTournamentResults(qb, parsed.data.Id, parsed.data.Teams);
        await qb.Commit();
        SetResponse(res, RESPONSE_CREATED, { message: "Tournament created successfully" , Id: parsed.data.Id });
    } catch (error) {
        console.log(error);
        await qb.Rollback();
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to insert tournament into database" });
    }
    finally {
        qb.Disconnect();
    }
});

// we assume that any missing ids are for games that are already handled
function MapTeamNamesToIdsIfExist(names: string[], identities: TeamIdentity[]): number[] {
    const ids = names.map(name => identities.find(y => y.Name == name));
    if(ids.some(x => x === undefined)) throw new Error("Couldn't find id for some teams");
    return ids.filter(x => x !== undefined).map(x => x?.Id);
}

router.post(PostTournamentResultsRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    const parsed = TournamentResultArraySchema.safeParse(req.body);
    if (!parsed.success) {
        SetResponse(res, RESPONSE_BAD_REQUEST, { error: "Invalid tournament data", details: parsed.error.errors });
        return;
    }
    try {
        await qb.Connect();
        await qb.BeginTransaction();
        const tournamentId = parsed.data.TournamentId;
        const results = parsed.data.Results;
        
        const teamNames = results.map(x => x.Name)
        let teams = await SelectTeamIdsByName(qb, teamNames);
        
        let completedTeams: number[] = [];

        const FindGameNumber = (teamId: number, opponentId: number, matchNumber: number) => {
            const result = results.find(x => x.Id == teamId);
            if (result == undefined) throw new Error("Couldn't find team with id: " + teamId);
            const opponentName = teams.find(x => x.Id == opponentId)?.Name;
            if (opponentName == undefined) throw new Error("Couldn't find team with id: " + opponentId);
            for(let i = 0; i < result.Games.length; ++i) {
                if(result.Games[i] == opponentName) {
                    if (matchNumber > 1)--matchNumber;
                    else return i + 1
                }
            }
            throw new Error(`Couldn't find matchup ${matchNumber} of ${teamId} and ${opponentId}`);
        }

        const FindGameNumbers = (teamId: number, opponentIds: number[]) => {
            const matchNumbers: Record<number, number> = {};
            return opponentIds.map(id => {
                const cur = matchNumbers[id] ? matchNumbers[id] : 1;
                const ret = FindGameNumber(id, teamId, cur);
                matchNumbers[id] = cur + 1;
                return [ret, cur];
            });
        }
        // Remove all games for tournament id
        await DeleteAllTournamentGames(qb, tournamentId);

        // Update placements of teams in tournament (rows should already exist)
        for(const res of results) {
            const id = teams.find(x => x.Name == res.Name)?.Id;
            if(id) {
                await UpdatePlacement(qb, {TournamentId: tournamentId, TeamId: id, Placement: res.Placement})
                if(res.Placement == 1) {
                    await SetTournamentWinner(qb, tournamentId, id);
                }
                // list of opponent ids
                // for each opponent, find out which game number it is playing this team.
                // if opponentid is in completedteams filter out
                const opponentIds = MapTeamNamesToIdsIfExist(res.Games.filter(x => x != null), teams);
                const opponentGameNumbers = FindGameNumbers(id, opponentIds);

                const games: GameInfo[] = opponentIds.map((opponentId, index) => ({
                    TeamId: id,
                    TeamGameNumber: index + 1,
                    OpponentId: opponentId,
                    OpponentGameNumber: opponentGameNumbers[index][0],
                    MatchNumber: opponentGameNumbers[index][1]
                })).filter(game => !completedTeams.includes(game.OpponentId));

                await InsertTournamentGames(qb, tournamentId, games);
                completedTeams.push(id);
            }
            else {
                console.log("Couldn't find id for team " + res.Name);
            }
        }
        await qb.Commit();
        SetResponse(res, RESPONSE_CREATED, { message: "Tournament Results created successfully" , Id: parsed.data.TournamentId });
    } catch (error) {
        console.log(error);
        await qb.Rollback();
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to insert tournament into database" });
    }
    finally {
        qb.Disconnect();
    }
});

router.delete(DeleteTournamentRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    
    // todo: remove reference to any games when saving VOD reviews
    try {
        await qb.Connect();
        await qb.BeginTransaction();
        const tournamentId = Number(req.query.TournamentId as string);
        await DeleteAllTournamentGames(qb, tournamentId);
        await DeleteResultsForTournamentId(qb, tournamentId);
        await DeleteTournament(qb, tournamentId);
        await qb.Commit();
        SetResponse(res, RESPONSE_OK, { message: "Tournament successfully deleted"});
    } catch (error) {
        console.log(error);
        await qb.Rollback();
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to delete tournament from database" });
    } 
    finally {
        qb.Disconnect();
    }
});

export default router;
