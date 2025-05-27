import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import { SQLComparator } from "../Helpers";
import pool from "../db";


export const TournamentResultsSchema = z.object({
  TournamentId: z.number(),
  TeamId: z.number(),
  Placement: z.number().nullable()
})

export type TournamentResult = z.infer<typeof TournamentResultsSchema>;
export const TournamentResultColumns = makeColumnMap(TournamentResultsSchema);
export const TournamentResultsName = "TournamentResults";


export async function UpdatePlacement(result: TournamentResult) {
    const qb = new QueryBuilder();
    qb.Update(TournamentResultsName)
        .Set([[TournamentResultColumns.Placement, result.Placement]])
        .Where([[TournamentResultColumns.TournamentId, SQLComparator.EQUAL, result.TournamentId],
                [TournamentResultColumns.TeamId, SQLComparator.EQUAL, result.TeamId]])

    await qb.Execute(pool);
}