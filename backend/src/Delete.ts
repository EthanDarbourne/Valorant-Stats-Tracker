import pool from './db';


export async function DeleteFromTable(table: string, where: Record<string, any>): Promise<void> {
  if (!table || !where || typeof where !== "object" || Object.keys(where).length === 0) {
    throw new Error("Invalid table name or where clause");
  }

  // Build WHERE clause: "key1" = $1 AND "key2" = $2 ...
  const keys = Object.keys(where);
  const conditions = keys.map((key, index) => `"${key}" = $${index + 1}`).join(" AND ");
  const values = Object.values(where);

  const query = `DELETE FROM "${table}" WHERE ${conditions}`;

  try {
    await pool.query(query, values);
    console.log(`Deleted from "${table}" where ${JSON.stringify(where)}`);
  } catch (error) {
    console.error(`Error deleting from "${table}":`, error);
    throw error;
  }
}