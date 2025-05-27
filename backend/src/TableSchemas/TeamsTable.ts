import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import pool from "../db";
import { SQLComparator } from "../Helpers";


export const TeamsTableSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  Region: z.string()
})

export type TeamRow = z.infer<typeof TeamsTableSchema>;
export const TeamColumns = makeColumnMap(TeamsTableSchema);
export const TeamTableName = "Teams";


export async function GetTeamsByRegion(region: string): Promise<string[]> {
  const qb = new QueryBuilder();

  qb.Select().Selectable(TeamColumns.Name)
    .From(TeamTableName)
    .WhereClause()
    .WhereSingle([TeamColumns.Region, SQLComparator.EQUAL, region]);

  const result = await qb.Execute(pool);
  return result.rows;
}

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
  return result.rows.map(x => ({Id: x.Id, Name: x.Name}));
}


export async function SelectTeamNameByIds(ids: number[]): Promise<TeamIdentity[]> {

  const qb = new QueryBuilder();
  qb.Select().Selectable(TeamColumns.Id).Selectable(TeamColumns.Name)
    .From(TeamTableName)
    .WhereClause();
  
  ids.forEach((id, index) => {
    if(index > 0)qb.WhereOp(SQLComparator.OR);
    qb.WhereSingle( [TeamColumns.Id, SQLComparator.EQUAL, id])
  });

  const result = await qb.Execute(pool);
  return result.rows.map(x => ({Id: x.Id, Name: x.Name}));
}