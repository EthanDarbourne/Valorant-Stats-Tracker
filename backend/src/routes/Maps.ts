import { Router, Request, Response } from 'express';
import { GetMapsList } from '../TableSchemas/MapsTable';
import { MakeCallWithDatabaseResult } from '../Helpers';

const router = Router();

router.get('/api/maps', async (req: Request, res: Response) => {
    await MakeCallWithDatabaseResult(async () => await GetMapsList(), res, "GetMapsList");
});

export default router;
