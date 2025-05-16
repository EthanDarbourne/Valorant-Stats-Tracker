import { z } from "zod";

export const TournamentSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  startDate: z.string(),  // You can use z.coerce.date() if you want actual Date objects
  endDate: z.string(),
  completed: z.boolean(),
  winner: z.string()
});

// If you're fetching an array of tournaments
export const TournamentArraySchema = z.array(TournamentSchema);

// Infer TypeScript type from the schema (optional but recommended)
export type Tournament = z.infer<typeof TournamentSchema>;
