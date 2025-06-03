import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import { SQLComparator } from "../Helpers";


export const TeamsTableSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  Region: z.string()
})

export type TeamRow = z.infer<typeof TeamsTableSchema>;
export const TeamColumns = makeColumnMap(TeamsTableSchema);
export const TeamTableName = "Teams";


export async function GetTeamsByRegion(qb: QueryBuilder, region: string): Promise<TeamIdentity[]> {

  qb.Select().Selectable(TeamColumns.Id).Selectable(TeamColumns.Name).Selectable(TeamColumns.Region)
    .From(TeamTableName)
    .WhereClause()
    .WhereSingle([TeamColumns.Region, SQLComparator.EQUAL, region]);

  const result = await qb.Execute();
  return result.rows.map(x => ({Id: x.Id, Name: x.Name, Region: x.Region }));
}

export interface TeamIdentity {
  Id: number,
  Name: string,
  Region: string
}

export async function SelectTeamIdsByName(qb: QueryBuilder, names: string[]): Promise<TeamIdentity[]> {
    if(names.length == 0)return [];

    qb.Select().Selectable(TeamColumns.Id).Selectable(TeamColumns.Name).Selectable(TeamColumns.Region)
        .From(TeamTableName)
        .WhereClause();
    
    names.forEach((name, index) => {
        if(index > 0)qb.WhereOp(SQLComparator.OR);
        qb.WhereSingle( [TeamColumns.Name, SQLComparator.EQUAL, name])
    });

    const result = await qb.Execute();
    return result.rows.map(x => ({Id: x.Id, Name: x.Name, Region: x.Region }));
}

export async function SelectTeamNameByIds(qb: QueryBuilder, ids: number[]): Promise<TeamIdentity[]> {
    if(ids.length == 0)return [];

    qb.Select().Selectable(TeamColumns.Id).Selectable(TeamColumns.Name).Selectable(TeamColumns.Region)
        .From(TeamTableName)
        .WhereClause();
    
    ids.forEach((id, index) => {
        if(index > 0)qb.WhereOp(SQLComparator.OR);
        qb.WhereSingle( [TeamColumns.Id, SQLComparator.EQUAL, id])
    });

    const result = await qb.Execute();
    return result.rows.map(x => ({Id: x.Id, Name: x.Name, Region: x.Region }));
}

export async function UpdateTeam(qb: QueryBuilder, team: TeamIdentity) {
    qb.Update(TeamTableName)
            .Set([[TeamColumns.Name, team.Name], [TeamColumns.Region, team.Region]])
            .Where([[TeamColumns.Id, SQLComparator.EQUAL, team.Id]])
    
    await qb.Execute();
}
