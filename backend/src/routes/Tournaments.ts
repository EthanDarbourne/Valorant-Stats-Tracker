import { Router, Request, Response } from 'express';
import pool from '../db';
import { GenerateSelectStatement, GetFromDatabase, AddWhereClause, GenerateSelectAllStatement } from '../Select';

const router = Router();

router.get('/api/tournaments', async (req: Request, res: Response) => {
    const query = GenerateSelectStatement("Tournaments", ["Name"]);
    await GetFromDatabase(query, res);
});

router.get('/api/tournamentById', async (req: Request, res: Response) => {
    const id = Number(req.query.id as string);
    const query = AddWhereClause(
        GenerateSelectAllStatement("Tournaments"),
        `WHERE "Id" = '${id}'`
    );
    await GetFromDatabase(query, res);
});

export default router;
