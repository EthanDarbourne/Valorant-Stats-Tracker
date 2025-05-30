import { Router, Request, Response } from 'express';
import { GetTeamsByRegion, SelectTeamNameByIds } from '../TableSchemas/TeamsTable';
import { MakeCallWithDatabaseResult, RESPONSE_BAD_REQUEST, RESPONSE_INTERNAL_ERROR, RESPONSE_OK, SetResponse } from '../Helpers';
import { GetTeamsByTournamentId } from '../TableSchemas/TournamentResultsTable';
import { TeamArraySchema } from "../../../shared/TeamSchema";
import { QueryBuilder } from '../QueryBuilder';
import pool from '../db';
import { FetchTeamsByRegionRoute, FetchTeamsByTournamentIdRoute } from '../../../shared/ApiRoutes';

const router = Router();

router.get(FetchTeamsByRegionRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    const region = req.query.Region as string;
    
    if (!region) {
        SetResponse(res, RESPONSE_BAD_REQUEST, { error: "Region is required" });
        return;
    }
    await MakeCallWithDatabaseResult(async () => await GetTeamsByRegion(qb, region), res, "GetTeamsByRegion:" + region);
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

        const parsedTeams = TeamArraySchema.parse(teams);

        SetResponse(res, RESPONSE_OK, parsedTeams);
        qb.Disconnect();
    }
    catch (error) {
        console.log(error);
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to select teams from database" });
    }
});

export default router;
