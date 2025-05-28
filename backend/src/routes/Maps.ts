import { Router, Request, Response } from 'express';
import { GetMapsList } from '../TableSchemas/MapsTable';
import { MakeCallWithDatabaseResult } from '../Helpers';
import { QueryBuilder } from '../QueryBuilder';
import pool from '../db';

const router = Router();

router.get('/api/maps', async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await GetMapsList(qb), res, "GetMapsList");
});

export default router;
