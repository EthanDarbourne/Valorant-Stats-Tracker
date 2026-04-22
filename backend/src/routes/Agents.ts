import { Router, Request, Response } from "express";
import pool from "../db";
import { QueryBuilder } from "../QueryBuilder";
import { FetchAgentRoles, FetchAgentsByRoleRoute, FetchAgentsRoute, PostAgent } from "../../../shared/ApiRoutes";
import { MakeCallWithDatabaseResult, RESPONSE_INTERNAL_ERROR, RESPONSE_OK, SetResponse } from "../Helpers";
import { AddAgent, AgentsSchema, GetAgentsByRoleList, GetAgentsList, GetRoles } from "../TableSchemas/AgentsTable";

const router = Router();

router.get(FetchAgentsRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await GetAgentsList(qb), res, "GetAgentsList");
});

router.get(FetchAgentsByRoleRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await GetAgentsByRoleList(qb, req.query.Role as string), res, "GetAgentsByRoleList");
});

router.get(FetchAgentRoles, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await GetRoles(qb), res, "GetRoles");
});

router.post(PostAgent, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    try {
        const agent = AgentsSchema.parse(req.body);
        await qb.Connect();
        await qb.BeginTransaction();

        await AddAgent(qb, agent);
        
        SetResponse(res, RESPONSE_OK, { message: "Inserted tags successfully"});
        await qb.Commit();
    }
    catch (error) {
        console.log(error);
        await qb.Rollback();
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to insert tags into database" });
    }
    finally {
        await qb.Disconnect();
    }
});

export default router;
