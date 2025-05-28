import {z} from "zod"
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import { SQLComparator } from "../Helpers";
import pool from "../db";

export const TournamentGamesTableSchema = z.object({
  Id: z.number(),
  TournamentId: z.number(),
  Team1Id: z.number(),
  Team2Id: z.number(),
  WinnerId: z.number().nullable(),
  MatchNumber: z.number(),
  MapCount: z.number(),
  PlayedAt: z.date(),
});

export type TournamentGameRow = z.infer<typeof TournamentGamesTableSchema>;
export const TournamentGameColumns = makeColumnMap(TournamentGamesTableSchema);
export const TournamentGameTableName = "TournamentGames";

export interface TournamentGameInsert {
  tournamentId: number,
  teamId: number,
  gameIds: number[]
}

export async function DeleteAllTournamentGames(qb: QueryBuilder, tournamentId: number) {
    qb.Delete(TournamentGameTableName)
    .WhereClause().WhereSingle([TournamentGameColumns.TournamentId, SQLComparator.EQUAL, tournamentId]);

    await qb.Execute();
}

export async function InsertTournamentGames(qb: QueryBuilder, tournamentId: number, teamId: number, opponentIds: number[]) {
    if(opponentIds.length == 0)return;

    const prev: Record<number, number> = {};

    const [Id, ...columnsWithoutId] = Object.keys(TournamentGameColumns);

    qb.Insert(TournamentGameTableName, columnsWithoutId);

    opponentIds.forEach(id => {
        const cur = prev[id] ? prev[id] : 1;
        qb.AddValue([tournamentId, teamId, id, null, cur, 3, new Date()]);
        prev[id] = cur + 1;
    });

    await qb.Execute();
}