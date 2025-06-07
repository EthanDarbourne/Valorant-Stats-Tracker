import { Router, Request, Response } from "express";
import pool from "../db";
import { QueryBuilder } from "../QueryBuilder";
import { SelectGamesByTournamentId } from "../TableSchemas/TournamentGamesTable";
import { GetUnique, RESPONSE_INTERNAL_ERROR, RESPONSE_OK, SetResponse } from "../Helpers";
import { SelectTeamNameByIds } from "../TableSchemas/TeamsTable";
import { GameArray } from "../../../shared/GameSchema";
import { FetchGamesByTournamentIdRoute } from "../../../shared/ApiRoutes";

const router = Router();


router.get(FetchGamesByTournamentIdRoute, async (req: Request, res: Response) => {
    
    try {

        const qb = new QueryBuilder(pool);
        
        const tournamentId = Number(req.query.TournamentId as string);
        
        
        const games = await SelectGamesByTournamentId(qb, tournamentId);
        
        const teamIds = GetUnique(games.flatMap(x => [x.Team1Id, x.Team2Id]));
        
        const teamNames = await SelectTeamNameByIds(qb, teamIds);
        
        const getTeamName = (id: number) => teamNames.find(x => x.Id == id)?.Name ?? "";
        const gamesWithNames: GameArray = games.map(x => ({
            Id: x.Id,
            TournamentId: x.TournamentId,
            TeamNameA: getTeamName(x.Team1Id),
            TeamNameB: getTeamName(x.Team2Id),
            WinnerName: x.WinnerId ? getTeamName(x.WinnerId): null,
            MatchNumber: x.MatchNumber,
            MapCount: x.MapCount,
            PlayedAt: x.PlayedAt
        }));
        
        SetResponse(res, RESPONSE_OK, gamesWithNames);
    }
    catch (error) {
        SetResponse(res, RESPONSE_INTERNAL_ERROR);
    }
});




export default router;
