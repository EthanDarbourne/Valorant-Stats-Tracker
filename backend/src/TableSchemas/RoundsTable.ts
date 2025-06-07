import { z } from "zod"
import { QueryBuilder } from "../QueryBuilder"
import { makeColumnMap } from "./MakeCol";

export const RoundsSchema = z.object({
    TournamentGameId: z.number(),
    RoundNumber: z.number(),
    TeamAId: z.number(),
    TeamBId: z.number(),
    DefenceTeamId: z.number(),
    RoundWinnerId: z.number(),
    Notes: z.string().nullable()
})

export type RoundRow = z.infer<typeof RoundsSchema>
export const RoundsColumns = makeColumnMap(RoundsSchema);

export const RoundsTableName = "TournamentRounds"

export async function InsertRounds(qb: QueryBuilder, rounds: RoundRow[]) {
    qb.Insert(RoundsTableName, Object.keys(RoundsColumns))
        .AddValues(rounds.map(x => Object.values(x)));

    await qb.Execute();
}