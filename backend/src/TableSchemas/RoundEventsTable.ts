import { z } from "zod"
import { QueryBuilder } from "../QueryBuilder"
import { extractValuesInSchemaOrder, makeColumnMap } from "./MakeCol";

export const RoundEventSchema = z.object({
    TournamentGameId: z.number(),
    TournamentMapId: z.number(),
    RoundNumber: z.number(),
    EventOrder: z.number(),
    EventName: z.string(),
})

export type RoundEventRow = z.infer<typeof RoundEventSchema>
export const RoundEventsColumns = makeColumnMap(RoundEventSchema);

export const RoundEventsTableName = "TournamentRoundEvents"

export async function InsertRoundEvents(qb: QueryBuilder, roundEvents: RoundEventRow[]) {
    qb.Insert(RoundEventsTableName, Object.keys(RoundEventsColumns))
            .AddValues(extractValuesInSchemaOrder(RoundEventsColumns, roundEvents));
    
        await qb.Execute();
}