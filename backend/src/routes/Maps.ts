import { Router, Request, Response } from 'express';
import pool from '../db';
import { GenerateSelectStatement, GetFromDatabase, AddWhereClause } from '../Select';

const router = Router();

router.get('/api/maps', async (req: Request, res: Response) => {
    const query = AddWhereClause(GenerateSelectStatement("Maps", ["Name"]), "WHERE \"Active\" = true");
    await GetFromDatabase(query, res);
});

export default router;
