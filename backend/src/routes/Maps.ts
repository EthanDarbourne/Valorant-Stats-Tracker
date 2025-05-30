import { Router, Request, Response } from 'express';
import { GetMapsList } from '../TableSchemas/MapsTable';
import { MakeCallWithDatabaseResult } from '../Helpers';
import { QueryBuilder } from '../QueryBuilder';
import pool from '../db';
import { FetchMapsRoute } from '../../../shared/ApiRoutes';

const router = Router();

router.get(FetchMapsRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await GetMapsList(qb), res, "GetMapsList");
});

export default router;
