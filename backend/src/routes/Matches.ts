import { Router, Request, Response } from "express";
import pool from "../db";
import { QueryBuilder } from "../QueryBuilder";
import { RESPONSE_INTERNAL_ERROR, RESPONSE_OK, SetResponse } from "../Helpers";
import { FetchMatchesByTournamentIdRoute } from "../../../shared/ApiRoutes";
import { SelectMatchesByTournamentId } from "../TableSchemas/TournamentMatchesTable";

const router = Router();


router.get(FetchMatchesByTournamentIdRoute, async (req: Request, res: Response) => {
    
    try {

        const qb = new QueryBuilder(pool);
        
        const tournamentId = Number(req.query.TournamentId as string);

        const matches = await SelectMatchesByTournamentId(qb, tournamentId);

        SetResponse(res, RESPONSE_OK, matches);
    }
    catch (error) {
        SetResponse(res, RESPONSE_INTERNAL_ERROR);
    }
});

export default router;
