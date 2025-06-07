


import { z } from "zod"
import { QueryBuilder } from "../QueryBuilder";
import { extractValuesInSchemaOrder, makeColumnMap } from "./MakeCol";

export const PlayerGameStatsSchema = z.object({
    TournamentId: z.number(),
    GameId: z.number(),
    MapId: z.number(),
    TeamId: z.number(),
    PlayerId: z.number(),
    Agent: z.string(),
    FirstHalfKills: z.number(),
    FirstHalfDeaths: z.number(),
    FirstHalfAssists: z.number(),
    TotalKills: z.number(),
    TotalDeaths: z.number(),
    TotalAssists: z.number(),
});

export type PlayerGameStats = z.infer<typeof PlayerGameStatsSchema>
export const PlayerGameStatsTableName = "PlayerGameStats"
export const PlayerGameStatsColumns = makeColumnMap(PlayerGameStatsSchema);


export async function InsertPlayerGameStats(qb: QueryBuilder, stats: PlayerGameStats[]) {

    const values = extractValuesInSchemaOrder(PlayerGameStatsColumns, stats);
    qb.Insert(PlayerGameStatsTableName, Object.keys(PlayerGameStatsColumns))
        .AddValues(values);

    await qb.Execute();
}