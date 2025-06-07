import {z} from "zod"
import { QueryBuilder } from "../QueryBuilder";
import { makeColumnMap } from "./MakeCol";


export const TournamentMapsTableSchema = z.object({
  Id: z.number(),
  TournamentId: z.number(),
  GameId: z.number(),
  MapNumber: z.number(),
  MapName: z.string(),
  Team1Id: z.number(),
  Team1Score: z.number(),
  Team2Id: z.number(),
  Team2Score: z.number(),
  WinnerId: z.number().nullable(),
});

export type TournamentMapRow = z.infer<typeof TournamentMapsTableSchema>
export const TournamentMapsTableName = "TournamentMaps"

export const TournamentMapsColumns = makeColumnMap(TournamentMapsTableSchema);

export async function InsertTournamentMap(qb: QueryBuilder, map: TournamentMapRow): Promise<number> {

    qb.Insert(TournamentMapsTableName, Object.keys(TournamentMapsColumns))
        .AddValue(Object.values(map))
        .GetReturnValue("Id");

    const result = await qb.Execute();
    return Number(result.rows[0][TournamentMapsColumns.Id]);
}