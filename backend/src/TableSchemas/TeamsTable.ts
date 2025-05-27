import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import pool from "../db";
import { SQLComparator } from "../Helpers";


export const TeamsSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  Region: z.string()
})

export type Team = z.infer<typeof TeamsSchema>;
export const TeamColumns = makeColumnMap(TeamsSchema);
export const TeamTableName = "Teams";


export interface TeamIdentity {
  Id: number,
  Name: string
}

export async function SelectTeamIdsByName(names: string[]): Promise<TeamIdentity[]> {

  const qb = new QueryBuilder();
  qb.Select().Selectable(TeamColumns.Id).Selectable(TeamColumns.Name)
    .From(TeamTableName)
    .WhereClause();
  
  names.forEach((name, index) => {
    if(index > 0)qb.WhereOp(SQLComparator.OR);
    qb.WhereSingle( [TeamColumns.Name, SQLComparator.EQUAL, name])
  });

  const result = await qb.Execute(pool);
  return result.rows.map(x => ({Id: x.Id, Name: x.Name}))
}