import { Router, Request, Response } from 'express';
import pool from '../db';
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

router.get('/api/teamsByTournament', async (req: Request, res: Response) => {

    const tournament = req.query.tournament as string;

    if (!tournament) {
        res.status(400).json({ error: "Tournament is required" });
        return;
    }

    const query = AddWhereClause(
        GenerateSelectStatement("TournamentResults", ["TeamName"]),
        `WHERE "TournamentName" = '${tournament}'`
    );
    await GetFromDatabase(query, res);
});

export default router;
