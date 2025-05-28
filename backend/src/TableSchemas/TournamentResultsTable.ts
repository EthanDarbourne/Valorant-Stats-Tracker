import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import { SQLComparator } from "../Helpers";
import pool from "../db";


export const TournamentResultsTableSchema = z.object({
  TournamentId: z.number(),
  TeamId: z.number(),
  Placement: z.number().nullable()
})

export type TournamentResultRow = z.infer<typeof TournamentResultsTableSchema>;
export const TournamentResultColumns = makeColumnMap(TournamentResultsTableSchema);
export const TournamentResultsName = "TournamentResults";


export async function UpdatePlacement(qb: QueryBuilder, result: TournamentResultRow) {
    qb.Update(TournamentResultsName)
        .Set([[TournamentResultColumns.Placement, result.Placement]])
        .Where([[TournamentResultColumns.TournamentId, SQLComparator.EQUAL, result.TournamentId],
                [TournamentResultColumns.TeamId, SQLComparator.EQUAL, result.TeamId]])

    await qb.Execute();
}

export async function InsertTournamentResult(qb: QueryBuilder, result: TournamentResultRow) {
    qb.Insert(TournamentResultsName, Object.keys(TournamentResultColumns))
        .AddValue(Object.values(result));

    await qb.Execute();
}

export async function GetTeamsByTournamentId(qb: QueryBuilder, tournamentId: number): Promise<TournamentResultRow[]> {
    qb.SelectAll()
        .From(TournamentResultsName)
        .WhereClause()
        .WhereSingle([TournamentResultColumns.TournamentId, SQLComparator.EQUAL, tournamentId]);

    const result = await qb.Execute();
    return result.rows.map(x => TournamentResultsTableSchema.parse(x));
}

export async function DeleteResultsForTournamentId(qb: QueryBuilder, tournamentId: number) {
    qb.Delete(TournamentResultsName)
        .WhereClause()
        .WhereSingle([TournamentResultColumns.TournamentId, SQLComparator.EQUAL, tournamentId]);

    await qb.Execute();
}