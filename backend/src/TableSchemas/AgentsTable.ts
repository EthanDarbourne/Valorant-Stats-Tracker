import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import { SQLComparator } from "../Helpers";
import { syncBuiltinESMExports } from "module";

export const AgentsSchema = z.object({
    Name: z.string(),
    Role: z.string(),
});

export type AgentRow = z.infer<typeof AgentsSchema>;
export const AgentsColumns = makeColumnMap(AgentsSchema);
export const AgentsTableName = "Agents";

export async function GetAgentsList(qb: QueryBuilder): Promise<string[]> {
    qb.Select()
        .Selectable(AgentsColumns.Name)
        .From(AgentsTableName)
        .SortBy(AgentsColumns.Name, "ASC");

    const result = await qb.Execute();
    return result.rows;
}

export async function GetAgentsByRoleList(qb: QueryBuilder, role: string): Promise<string[]> {
    qb.Select()
        .Selectable(AgentsColumns.Name)
        .From(AgentsTableName)
        .WhereClause()
        .WhereSingle([AgentsColumns.Role, SQLComparator.EQUAL, role])
        .SortBy(AgentsColumns.Name, "ASC");

    const result = await qb.Execute();
    return result.rows;
}

export async function GetRoles(qb: QueryBuilder): Promise<string[]> {
    qb.SelectDistinct()
        .Selectable(AgentsColumns.Role)
        .From(AgentsTableName)
        .SortBy(AgentsColumns.Role, "ASC");

    const result = await qb.Execute();
    return result.rows;
}

export async function AddAgent(qb: QueryBuilder, agent: AgentRow) {
    qb.Insert(AgentsTableName, Object.keys(AgentsColumns)).AddValue(Object.values(agent));

    await qb.Execute();
}
