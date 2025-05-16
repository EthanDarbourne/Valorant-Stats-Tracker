

import pool from './db';

/**
 * Inserts a row into the specified table using column-value pairs.
 * @param table - The name of the table to insert into.
 * @param object - An object where keys are column names and values are the values to insert.
 */
export async function InsertToDatabase(table: string, object: Record<string, any>): Promise<string> {
  const keys = Object.keys(object);
  const values = Object.values(object);

  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
  const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING id`;

  try {
    const result = await pool.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error("Error inserting into database:", error);
    throw error;
  }
}

export async function UpdateInDatabase(table: string, columns: Record<string, any>): Promise<void> {
  if (!columns.id) {
    throw new Error("Missing 'id' in data for update.");
  }

  const { id, ...fieldsToUpdate } = columns;

  const keys = Object.keys(fieldsToUpdate);
  const values = Object.values(fieldsToUpdate);

  const setClauses = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
  const query = `UPDATE ${table} SET ${setClauses} WHERE id = $${keys.length + 1}`;

  try {
    await pool.query(query, [...values, id]);
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
}