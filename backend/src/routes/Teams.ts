import { Router, Request, Response } from 'express';
import { GenerateSelectStatement, GetFromDatabase, AddWhereClause } from '../Select';

const router = Router();

router.get('/api/teamsByRegion', async (req: Request, res: Response) => {

    const region = req.query.region as string;

    if (!region) {
        res.status(400).json({ error: "Region is required" });
        return;
    }

    const query = AddWhereClause(
        GenerateSelectStatement("Teams", ["Name"]),
        `WHERE "Region" = '${region}'`
    );
    await GetFromDatabase(query, res);
});

router.get('/api/teamsByTournamentId', async (req: Request, res: Response) => {

    const tournamentId = req.query.tournamentId as string;

    if (!tournamentId) {
        res.status(400).json({ error: "Tournament is required" });
        return;
    }

    const query = AddWhereClause(
        GenerateSelectStatement("TournamentResults", ["TeamName"]),
        `WHERE "TournamentId" = '${tournamentId}'`
    );
    await GetFromDatabase(query, res);
});

export default router;
