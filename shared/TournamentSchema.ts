import { toInputDateString } from "./Helpers";
import { z } from "zod";
import { TournamentResultSchema } from "./TournamentResultsSchema";

export const TeamInfoSchema = z.object({
    Id: z.number(),
    Name: z.string(),
    Placement: z.number().nullable()
})

export const TournamentInfoSchema = z.object({
    Id: z.number(),
    Name: z.string(),
    Location: z.string(),
    StartDate: z.string(),
    EndDate: z.string(),
    Completed: z.boolean(),
    Teams: z.array(TeamInfoSchema).optional().default([]),
});

export const EntireTournamentSchema = z.object({
    Id: z.number(),
    Name: z.string(),
    Location: z.string(),
    StartDate: z.string(),
    EndDate: z.string(),
    Completed: z.boolean(),
    Teams: z.array(TournamentResultSchema).optional().default([])
})

export type EntireTournament = z.infer<typeof EntireTournamentSchema>;

export const TournamentArraySchema = z.array(TournamentInfoSchema);

export type TeamInfo = z.infer<typeof TeamInfoSchema>;
export type TournamentInfo = z.infer<typeof TournamentInfoSchema>;
export type TournamentArray = z.infer<typeof TournamentArraySchema>;

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

export const DefaultTournament = {       
    Id: -1,
    Name: "",
    Location: "",
    StartDate: "",
    EndDate: "",
    Completed: false,
    Teams: []
}