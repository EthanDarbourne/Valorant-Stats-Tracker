import {z} from "zod"
import { QueryBuilder } from "../QueryBuilder";
import { extractValueInSchemaOrder, makeColumnMap } from "./MakeCol";


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

  const { Id, ...columnsWithoutId } = TournamentMapsColumns;
    qb.Insert(TournamentMapsTableName, Object.keys(columnsWithoutId))
        .AddValue(extractValueInSchemaOrder(columnsWithoutId, map))
        .GetReturnValue(TournamentMapsColumns.Id);

    const result = await qb.Execute();
    return Number(result.rows[0][TournamentMapsColumns.Id]);
}