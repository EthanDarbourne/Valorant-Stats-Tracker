
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

export function AddWhereClause(statement: string, clause: string) {
    return statement + ' ' + clause;
}
  
export async function GetFromDatabase(statement: string, res: Response) {
    try {
        const result = await pool.query(statement);
        return res.json(result.rows);
    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}