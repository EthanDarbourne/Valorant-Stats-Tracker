

import pool from './db';
import { Quote, QuoteAll } from './Helpers';

/**
 * Inserts a row into the specified table using column-value pairs.
 * @param table - The name of the table to insert into.
 * @param object - An object where keys are column names and values are the values to insert.
 */
export async function InsertToDatabase(table: string, object: Record<string, any>, returnVal?: string | null): Promise<number> {
  const keys = Object.keys(object);
  const values = Object.values(object);

  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
  let query = `INSERT INTO ${Quote(table)} (${QuoteAll(keys)}) VALUES (${placeholders})`;
  if(returnVal) {
    query +=  ` RETURNING "${returnVal}"`
  }
  console.log(query)
  try {
    const result = await pool.query(query, values);
    return returnVal ? Number(result.rows[0][returnVal]) : 0;
  } catch (error) {
    console.error("Error inserting into database:", error);
    throw error;
  }
}

export async function UpdateInDatabase(table: string, columns: Record<string, any>): Promise<void> {
  if (!columns.Id) {
    throw new Error("Missing 'Id' in data for update.");
  }

  const { Id, ...fieldsToUpdate } = columns;

  const keys = Object.keys(fieldsToUpdate);
  const values = Object.values(fieldsToUpdate);

  const setClauses = keys.map((key, index) => `${Quote(key)} = $${index + 1}`).join(", ");
  const query = `UPDATE ${Quote(table)} SET ${setClauses} WHERE "Id" = $${keys.length + 1}`;

  try {
    await pool.query(query, [...values, Id]);
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
}