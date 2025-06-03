import { Router, Request, Response } from 'express';
import { GetTeamsByRegion, SelectTeamNameByIds, UpdateTeam } from '../TableSchemas/TeamsTable';
import { RESPONSE_BAD_REQUEST, RESPONSE_INTERNAL_ERROR, RESPONSE_OK, SetResponse } from '../Helpers';
import { GetTeamsByTournamentId } from '../TableSchemas/TournamentResultsTable';
import { QueryBuilder } from '../QueryBuilder';
import pool from '../db';
import { FetchTeamsByRegionRoute, FetchTeamsByTournamentIdRoute, PostTeamRoute } from '../../../shared/ApiRoutes';
import { AddPlayersToTeams, UpdatePlayersInTeam } from '../TableSchemas/PlayersTable';
import { TeamSchema } from '../../../shared/TeamSchema';

const router = Router();

router.get(FetchTeamsByRegionRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    const region = req.query.Region as string;
    
    if (!region) {
        SetResponse(res, RESPONSE_BAD_REQUEST, { error: "Region is required" });
        return;
    }
    try {
        await qb.Connect();
        const teamIdentities = await GetTeamsByRegion(qb, region);

        const teamsWithPlayers = await AddPlayersToTeams(qb, teamIdentities);

        SetResponse(res, RESPONSE_OK, teamsWithPlayers);
    }
    catch (error) {
        console.log(error);
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to select teams from database" });
    }
    finally {
        qb.Disconnect();
    }
});

router.get(FetchTeamsByTournamentIdRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    const tournamentId = req.query.TournamentId as string;
    
    if (!tournamentId) {
        SetResponse(res, RESPONSE_BAD_REQUEST, { error: "Tournament is required" });
        return;
    }

    try {
        await qb.Connect();
        const teamIds = (await GetTeamsByTournamentId(qb, Number(tournamentId))).map(x => x.TeamId);

        const teams = await SelectTeamNameByIds(qb, teamIds);

        const teamsWithPlayers = await AddPlayersToTeams(qb, teams);

        SetResponse(res, RESPONSE_OK, teamsWithPlayers);
    }
    catch (error) {
        console.log(error);
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to select teams from database" });
    }
    finally {
        qb.Disconnect();
    }
});

router.post(PostTeamRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    try {
        const team = TeamSchema.parse(req.body);
        await qb.Connect();
        await qb.BeginTransaction();

        // save to team table
        await UpdateTeam(qb, ({Id: team.Id, Name: team.Name, Region: team.Region }));
        // save all players to player table
        await UpdatePlayersInTeam(qb, team);

        SetResponse(res, RESPONSE_OK, { message: "Updated team successfully"});
        await qb.Commit();
    }
    catch (error) {
        console.log(error);
        await qb.Rollback();
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to update players on team from database" });
    }
    finally {
        qb.Disconnect();
    }
});

export default router;
