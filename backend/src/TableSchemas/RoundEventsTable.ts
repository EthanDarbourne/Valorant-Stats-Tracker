import { z } from "zod"
import { QueryBuilder } from "../QueryBuilder"
import { makeColumnMap } from "./MakeCol";

export const RoundEventSchema = z.object({
    TournamentGameId: z.number(),
    RoundNumber: z.number(),
    RoundWinnerId: z.number(),
    EventOrder: z.number(),
    EventName: z.string(),
})

export type RoundEventRow = z.infer<typeof RoundEventSchema>
export const RoundEventsColumns = makeColumnMap(RoundEventSchema);

export const RoundEventsTableName = "TournamentRoundEvents"

export async function InsertRoundEvents(qb: QueryBuilder, rounds: RoundEventRow[]) {
    qb.Insert(RoundEventsTableName, Object.keys(RoundEventsColumns))
            .AddValues(rounds.map(x => Object.values(x)));
    
        await qb.Execute();
}