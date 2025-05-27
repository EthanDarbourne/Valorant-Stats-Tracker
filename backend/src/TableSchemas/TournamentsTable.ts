import {z} from "zod"
import { makeColumnMap } from "./MakeCol";

export const TournamentsTableSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  Location: z.string(),
  StartDate: z.string(),
  EndDate: z.string(),
  Completed: z.boolean(),
  Winner: z.string(),
});

export type Tournament = z.infer<typeof TournamentsTableSchema>;
export const TournamentColumns = makeColumnMap(TournamentsTableSchema);

export const TournamentsTableName = "Tournaments";