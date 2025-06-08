import { Router, Request, Response } from 'express';
import { GetMapsList } from '../TableSchemas/MapsTable';
import { MakeCallWithDatabaseResult, RESPONSE_BAD_REQUEST, RESPONSE_INTERNAL_ERROR, RESPONSE_OK, SetResponse } from '../Helpers';
import { QueryBuilder } from '../QueryBuilder';
import pool from '../db';
import { FetchMapsRoute, PostTournamentMap } from '../../../shared/ApiRoutes';
import { TournamentGameRow, UpdateTournamentGame } from '../TableSchemas/TournamentGamesTable';
import { RoundEventRow, InsertRoundEvents } from '../TableSchemas/RoundEventsTable';
import { RoundRow, InsertRounds } from '../TableSchemas/RoundsTable';
import { PlayerStats, TournamentMap, TournamentMapSchema } from '../../../shared/EntireGameSchema';
import { InsertTournamentMap, TournamentMapRow } from '../TableSchemas/TournamentMaps';
import { InsertPlayerGameStats, PlayerGameStats } from '../TableSchemas/PlayerGameStatsTable';

const router = Router();

router.get(FetchMapsRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await GetMapsList(qb), res, "GetMapsList");
});

router.post(PostTournamentMap, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    try {
        await qb.Connect();
        await qb.BeginTransaction();
        const parsed = TournamentMapSchema.safeParse(req.body);
        if(!parsed.success) {
            SetResponse(res, RESPONSE_BAD_REQUEST, { error: "Invalid tournament game", details: parsed.error.errors });
            return;
        }
        const tournamentMap: TournamentMap = parsed.data;
        const tournamentId = tournamentMap.TournamentId;
        const gameId = tournamentMap.GameId;
        const teamAId = tournamentMap.TeamA.TeamId
        const teamBId = tournamentMap.TeamB.TeamId

        const getDefendingTeamId = (defTeam: number, atkTeam: number, roundNum: number) => {
            if (roundNum <= 12) return defTeam
            else if (roundNum <= 24) return atkTeam;
            else return roundNum % 2 ? defTeam : atkTeam;
        }
        let teamAScore = 0, teamBScore = 0;
        tournamentMap.Rounds.forEach(x => {
            if(x.RoundWinnerId == teamAId)++teamAScore;
            else if(x.RoundWinnerId == teamBId)++teamBScore;
        })
        
        const tournamentMapInfo: TournamentMapRow = {
            Id: -1,
            TournamentId: tournamentId,
            GameId: gameId,
            Team1Id: teamAId,
            Team1Score: teamAScore,
            Team2Id: teamBId,
            Team2Score: teamBScore,
            WinnerId: teamAScore > teamBScore ? teamAId : teamBId,
            MapName: tournamentMap.MapName,
            MapNumber: tournamentMap.MapNumber,
        }
        const mapId = await InsertTournamentMap(qb, tournamentMapInfo);

        const defendingTeamId = tournamentMap.TeamA.DefendingFirst ? teamAId : teamBId;
        const attackingTeamId = tournamentMap.TeamA.DefendingFirst ? teamBId : teamAId;

        const getPlayerStats = (players: PlayerStats[]) => players.map(player => ({
            TournamentId: tournamentId,
            GameId: gameId,
            MapId: mapId,
            TeamId: player.TeamId,
            Agent: player.Agent,
            PlayerId: player.PlayerId,
            FirstHalfKills: player.FirstHalfStats.Kills,
            FirstHalfDeaths: player.FirstHalfStats.Deaths,
            FirstHalfAssists: player.FirstHalfStats.Assists,
            TotalKills: player.TotalStats.Kills,
            TotalDeaths: player.TotalStats.Deaths,
            TotalAssists: player.TotalStats.Assists,
        }))
        const teamAPlayers: PlayerGameStats[] = getPlayerStats(tournamentMap.TeamA.Players)
        const teamBPlayers: PlayerGameStats[] = getPlayerStats(tournamentMap.TeamB.Players)

        await InsertPlayerGameStats(qb, teamAPlayers.concat(teamBPlayers));

        const simpleRounds: RoundRow[] = tournamentMap.Rounds.map((round, index) => ({
            TournamentGameId: gameId,
            TournamentMapId: mapId,
            RoundNumber: index + 1,
            TeamAId: teamAId,
            TeamBId: teamBId,
            DefenceTeamId: getDefendingTeamId(defendingTeamId, attackingTeamId, index + 1),
            RoundWinnerId: round.RoundWinnerId,
            Notes: round.Notes
        }));

        const roundEvents: RoundEventRow[] = tournamentMap.Rounds.flatMap((round, index) => round.Events.map((event, eventIdx) => ({
            TournamentGameId: gameId,
            TournamentMapId: mapId,
            RoundNumber: index + 1,
            EventOrder: eventIdx + 1,
            EventName: event
        })))

        await InsertRounds(qb, simpleRounds);
        await InsertRoundEvents(qb, roundEvents);
        await qb.Commit();
        SetResponse(res, RESPONSE_OK, { message: "Added game successfully" });
    }
    catch (error) {
        console.log(error);
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to add game" });
        await qb.Rollback();
    }
    finally {
        qb.Disconnect();
    }
});

export default router;
