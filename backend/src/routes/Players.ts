import { Request, Response, Router } from "express";
import { FetchAllPlayersWithoutTeams, PostPlayerRoute } from "../../../shared/ApiRoutes";
import pool from "../db";
import { MakeCallWithDatabaseResult } from "../Helpers";
import { QueryBuilder } from "../QueryBuilder";
import { InsertOrUpdatePlayer, PlayersTableSchema, SelectPlayersWithoutTeam } from "../TableSchemas/PlayersTable";

const router = Router();

router.get(FetchAllPlayersWithoutTeams, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await SelectPlayersWithoutTeam(qb), res, "FetchAllPlayersWithoutTeams");
});

router.post(PostPlayerRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await InsertOrUpdatePlayer(qb, PlayersTableSchema.parse(req.body)), res, "InsertOrUpdatePlayer");
});

export default router;