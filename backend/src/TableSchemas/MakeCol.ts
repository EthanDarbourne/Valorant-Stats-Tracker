import { z } from "zod"

export function makeColumnMap<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return Object.keys(schema.shape).reduce((acc, key) => {
    acc[key as keyof T] = key;
    return acc;
  }, {} as { [K in keyof T]: string });
}