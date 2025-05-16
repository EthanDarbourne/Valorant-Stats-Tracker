import z from "zod";

export const TournamentSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  completed: z.boolean(),
  winner: z.string(),
});