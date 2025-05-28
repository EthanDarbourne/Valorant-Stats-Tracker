import { Router, Request, Response } from 'express';
import { GetTeamsByRegion } from '../TableSchemas/TeamsTable';
import { MakeCallWithDatabaseResult, RESPONSE_BAD_REQUEST } from '../Helpers';
import { GetTeamsByTournamentId } from '../TableSchemas/TournamentResultsTable';
import { QueryBuilder } from '../QueryBuilder';
import pool from '../db';

const router = Router();

router.get('/api/teamsByRegion', async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    const region = req.query.region as string;
    
    if (!region) {
        res.status(RESPONSE_BAD_REQUEST).json({ error: "Region is required" });
        return;
    }
    await MakeCallWithDatabaseResult(async () => await GetTeamsByRegion(qb, region), res, "GetTeamsByRegion:" + region);
});

router.get('/api/teamsByTournamentId', async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    const tournamentId = req.query.tournamentId as string;
    
    if (!tournamentId) {
        res.status(RESPONSE_BAD_REQUEST).json({ error: "Tournament is required" });
        return;
    }
    await MakeCallWithDatabaseResult(
        async () => (await GetTeamsByTournamentId(qb, Number(tournamentId))).map(x => x.TeamId),
        res, "GetTeamsByTournamentId:" + tournamentId);
});

export default router;
