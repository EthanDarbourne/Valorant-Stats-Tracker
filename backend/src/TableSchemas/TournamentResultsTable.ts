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


export async function UpdatePlacement(result: TournamentResultRow) {
    const qb = new QueryBuilder();
    qb.Update(TournamentResultsName)
        .Set([[TournamentResultColumns.Placement, result.Placement]])
        .Where([[TournamentResultColumns.TournamentId, SQLComparator.EQUAL, result.TournamentId],
                [TournamentResultColumns.TeamId, SQLComparator.EQUAL, result.TeamId]])

    await qb.Execute(pool);
}

export async function InsertTournamentResult(result: TournamentResultRow) {
    const qb = new QueryBuilder();
    qb.Insert(TournamentResultsName, Object.keys(TournamentResultColumns))
        .AddValue(Object.values(result));

    await qb.Execute(pool);
}

export async function GetTeamsByTournamentId(tournamentId: number): Promise<TournamentResultRow[]> {
    const qb = new QueryBuilder();

    qb.SelectAll()
        .From(TournamentResultsName)
        .WhereClause()
        .WhereSingle([TournamentResultColumns.TournamentId, SQLComparator.EQUAL, tournamentId]);

    const result = await qb.Execute(pool);
    return result.rows.map(x => TournamentResultsTableSchema.parse(x));
}

export async function DeleteResultsForTournamentId(tournamentId: number) {
    const qb = new QueryBuilder();

    qb.Delete(TournamentResultsName)
        .WhereClause()
        .WhereSingle([TournamentResultColumns.TournamentId, SQLComparator.EQUAL, tournamentId]);

    await qb.Execute(pool);
}