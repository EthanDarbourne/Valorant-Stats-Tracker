import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import { SQLComparator } from "../Helpers";


export const AgentsSchema = z.object({
  Name: z.string(),
  Role: z.string()
})

export type AgentRow = z.infer<typeof AgentsSchema>;
export const AgentsColumns = makeColumnMap(AgentsSchema);
export const AgentsTableName = "Agents";


export async function GetAgentsList(qb: QueryBuilder): Promise<string[]> {

  qb.Select().Selectable(AgentsColumns.Name)
    .From(AgentsTableName);
  
  const result = await qb.Execute();
  return result.rows;
}

export async function GetAgentsByRoleList(qb: QueryBuilder, role: string): Promise<string[]> {

  qb.Select().Selectable(AgentsColumns.Name)
    .From(AgentsTableName)
        .WhereClause()
        .WhereSingle([AgentsColumns.Role, SQLComparator.EQUAL, role]);
  
  const result = await qb.Execute();
  return result.rows;
}