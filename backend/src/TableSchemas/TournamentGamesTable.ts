import {z} from "zod"
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import { SQLComparator } from "../Helpers";

export const TournamentGamesTableSchema = z.object({
  Id: z.number(),
  TournamentId: z.number(),
  Team1Id: z.number(),
  Team1GameNumber: z.number(),
  Team2Id: z.number(),
  Team2GameNumber: z.number(),
  WinnerId: z.number().nullable(),
  MatchNumber: z.number(),
  MapCount: z.number(),
  PlayedAt: z.date(),
});

export const TournamentGameRowArraySchema = z.array(TournamentGamesTableSchema);

export type TournamentGameRowArray = z.infer<typeof TournamentGameRowArraySchema>;
export type TournamentGameRow = z.infer<typeof TournamentGamesTableSchema>;
export const TournamentGameColumns = makeColumnMap(TournamentGamesTableSchema);
export const TournamentGameTableName = "TournamentGames";

export interface TournamentGameInsert {
  tournamentId: number,
  teamId: number,
  gameIds: number[]
}

export async function SelectGamesByTournamentId(qb: QueryBuilder, tournamentId: number): Promise<TournamentGameRowArray> {
    qb.SelectAll().From(TournamentGameTableName)
        .WhereClause().WhereSingle([TournamentGameColumns.TournamentId, SQLComparator.EQUAL, tournamentId]);

    const result = await qb.Execute();

    const gameRows = TournamentGameRowArraySchema.safeParse(result.rows);

    if(gameRows.success) {
        return gameRows.data;
    }
    else {
        throw new Error("Couldn't parse game array result: " + gameRows.error);
    }
}

export async function DeleteAllTournamentGames(qb: QueryBuilder, tournamentId: number) {
    qb.Delete(TournamentGameTableName)
    .WhereClause().WhereSingle([TournamentGameColumns.TournamentId, SQLComparator.EQUAL, tournamentId]);

    await qb.Execute();
}

export type GameInfo = {
    TeamId: number,
    TeamGameNumber: number,
    OpponentId: number,
    OpponentGameNumber: number,
    MatchNumber: number
}

export async function InsertTournamentGames(qb: QueryBuilder, tournamentId: number, games: GameInfo[]) {
    if(games.length == 0)return;

    const prev: Record<number, number> = {};

    const [Id, ...columnsWithoutId] = Object.keys(TournamentGameColumns);

    qb.Insert(TournamentGameTableName, columnsWithoutId);

    games.forEach(game => {
        const id = game.TeamId
        const cur = prev[id] ? prev[id] : 1;
        qb.AddValue([tournamentId, game.TeamId, game.TeamGameNumber, game.OpponentId, game.OpponentGameNumber, null, cur, 3, new Date()]);
        prev[id] = cur + 1;
    });

    await qb.Execute();
}