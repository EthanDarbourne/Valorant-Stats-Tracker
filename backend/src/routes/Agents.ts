import { Router, Request, Response } from "express";
import pool from "../db";
import { QueryBuilder } from "../QueryBuilder";
import { FetchAgentsByRoleRoute, FetchAgentsRoute } from "../../../shared/ApiRoutes";
import { MakeCallWithDatabaseResult } from "../Helpers";
import { GetAgentsByRoleList, GetAgentsList } from "../TableSchemas/AgentsTable";

const router = Router();

router.get(FetchAgentsRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await GetAgentsList(qb), res, "GetAgentsList");
});

router.get(FetchAgentsByRoleRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await GetAgentsByRoleList(qb, req.query.Role as string), res, "GetAgentsByRoleList");
});

export default router;
