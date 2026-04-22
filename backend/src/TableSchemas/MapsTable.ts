import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import { SQLComparator } from "../Helpers";


export const MapsSchema = z.object({
  Name: z.string(),
  Active: z.boolean()
})

export type MapRow = z.infer<typeof MapsSchema>;
export const MapsColumns = makeColumnMap(MapsSchema);

export const MapArraySchema = z.array(MapsSchema);
export type MapArray = z.infer<typeof MapArraySchema>;
export const MapsTableName = "Maps";


export async function GetMapsList(qb: QueryBuilder): Promise<string[]> {

  qb.Select().Selectable(MapsColumns.Name)
    .From(MapsTableName)
    .WhereClause()
    .WhereSingle([MapsColumns.Active, SQLComparator.EQUAL, true])
    .SortBy(MapsColumns.Name, "ASC");
  
  const result = await qb.Execute();
  return result.rows;
}

export async function GetAllMaps(qb: QueryBuilder): Promise<string[]> {

  qb.Select().Selectable(MapsColumns.Name).Selectable(MapsColumns.Active)
    .From(MapsTableName)
    .SortBy(MapsColumns.Name, "ASC");
  
  const result = await qb.Execute();
  return result.rows;
}

export async function UpdateMapsList(qb: QueryBuilder, maps: MapArray) {
    qb.Insert(MapsTableName, Object.keys(MapsColumns));

    maps.forEach(map => {
        qb.AddValue(Object.values(map))
    });

    qb.OnConflict([MapsColumns.Name], "DO UPDATE", Object.keys(MapsColumns));

    await qb.Execute();
}