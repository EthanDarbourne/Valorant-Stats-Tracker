import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";

export const TagTableSchema = z.object({
  Category: z.string(),
  Name: z.string()
})

export type TagRow = z.infer<typeof TagTableSchema>;

export const TagArraySchema = z.array(TagTableSchema);
export type TagArray = z.infer<typeof TagArraySchema>;

export const TagColumns = makeColumnMap(TagTableSchema);
export const TagTableName = "Tags";


export async function GetAllTags(qb: QueryBuilder): Promise<string[]> {

  qb.SelectAll()
    .From(TagTableName);
  
  const result = await qb.Execute();
  return result.rows;
}

export async function InsertTags(qb: QueryBuilder, tags: TagArray) {

    qb.Insert(TagTableName, Object.keys(TagColumns));

    tags.forEach(tag  => {
        qb.AddValue(Object.values(tag));
    });
    
    qb.OnConflict(Object.keys(TagColumns), "DO NOTHING");

    await qb.Execute();
}