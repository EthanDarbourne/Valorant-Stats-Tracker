
import { Router, Request, Response } from 'express';
import pool from './db';


export function GenerateSelectStatement(tableName: string, columns: string[]): string {
    if (!tableName || columns.length === 0) {
      throw new Error("Table name and at least one column name must be provided.");
    }
  
    const formattedColumns = columns.map(col => `"${col}"`).join(", ");
    return `SELECT ${formattedColumns} FROM "${tableName}"`;
}

export function GenerateSelectAllStatement(tableName: string): string {
    if (!tableName) {
      throw new Error("Table name and at least one column name must be provided.");
    }
    return `SELECT * FROM "${tableName}"`;
}

export function AddWhereClause(query: string, clause: string) {
    return query + ' ' + clause;
}
  
export async function GetSingleFromDatabase(query: string, res: Response) {
    try {
        const result = await pool.query(query);
        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function GetFromDatabase(query: string, res: Response) {
    try {
        const result = await pool.query(query);
        return res.status(201).json(result.rows);
    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function SelectFromTableWhere(
  table: string,
  where: Record<string, any>
): Promise<any[]> {
  if (!table || typeof table !== "string") {
    throw new Error("Table name must be a non-empty string");
  }

  if (!where || typeof where !== "object" || Object.keys(where).length === 0) {
    throw new Error("Where clause must be a non-empty object");
  }

  const keys = Object.keys(where);
  const conditions = keys.map((key, index) => `"${key}" = $${index + 1}`).join(" AND ");
  const values = Object.values(where);

  const query = `SELECT * FROM "${table}" WHERE ${conditions}`;

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error running query:", query, "with values:", values, error);
    throw error;
  }
}