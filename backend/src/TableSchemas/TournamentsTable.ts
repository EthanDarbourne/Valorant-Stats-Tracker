import {z} from "zod"

export const TournamentsTableSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  Location: z.string(),
  StartDate: z.string(),
  EndDate: z.string(),
  Completed: z.boolean(),
  Winner: z.string(),
});