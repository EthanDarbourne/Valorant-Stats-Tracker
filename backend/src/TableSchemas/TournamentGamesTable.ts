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
  WinnerId: z.number(),
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

export async function DeleteAllTournamentGames(tournamentId: number) {
    const qb = new QueryBuilder();

    qb.Delete(TournamentGameTableName)
    .Where([[TournamentGameColumns.TournamentId, SQLComparator.EQUAL, tournamentId]]);

    await qb.Execute(pool);
}

export async function InsertTournamentGames(games: TournamentGameInsert) {

}