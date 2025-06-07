import { z } from "zod"

export function makeColumnMap<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return Object.keys(schema.shape).reduce((acc, key) => {
    acc[key as keyof T] = key;
    return acc;
  }, {} as { [K in keyof T]: string });
}

export function extractValuesInSchemaOrder<T extends z.ZodRawShape>(
    columns: { [K in keyof T]: string },
    rows: Array<z.infer<z.ZodObject<T>>>
): any[][] {
    const keys = Object.keys(columns); // Preserves definition order in most modern JS engines
    return rows.map(row => keys.map(k => (row as any)[k]));
}

export function extractValueInSchemaOrder<T extends z.ZodRawShape>(
    columns: { [K in keyof T]: string },
    row: z.infer<z.ZodObject<T>>
): any[][] {
    const keys = Object.keys(columns); // Preserves definition order in most modern JS engines
    return keys.map(k => (row as any)[k]);
}