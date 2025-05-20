import { toInputDateString } from "@/Helpers";
import { z } from "zod";

export const TournamentSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  Location: z.string(),
  StartDate: z.string(),
  EndDate: z.string(),
  Completed: z.boolean(),
  Winner: z.string(),
  Teams: z.array(z.string()).optional().default([]),
});

// If you're fetching an array of tournaments
export const TournamentArraySchema = z.array(TournamentSchema);

// Infer TypeScript type from the schema (optional but recommended)
export type Tournament = z.infer<typeof TournamentSchema>;

export function FixDates(data: any) {
  return ({...data,
      StartDate: toInputDateString(data.StartDate),
      EndDate: toInputDateString(data.EndDate),
      });
}

export function FixDatesInArray(data: any[]) {
  return data.map(x => ({
      ...x,
      StartDate: toInputDateString(x.StartDate),
      EndDate: toInputDateString(x.EndDate),
      }));
}