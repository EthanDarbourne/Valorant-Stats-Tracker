import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import pool from "../db";
import { SQLComparator } from "../Helpers";


export const MapsSchema = z.object({
  Name: z.string(),
  Active: z.boolean()
})

export type MapRow = z.infer<typeof MapsSchema>;
export const MapsColumns = makeColumnMap(MapsSchema);
export const MapsTableName = "Maps";


export async function GetMapsList(): Promise<string[]> {

  const qb = new QueryBuilder();
  qb.Select().Selectable(MapsColumns.Name)
    .From(MapsTableName)
    .WhereClause()
    .WhereSingle([MapsColumns.Active, SQLComparator.EQUAL, true]);
  
  const result = await qb.Execute(pool);
  return result.rows;
}