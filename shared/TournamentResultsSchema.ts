import { z } from "zod";

export const TournamentResultSchema = z.object({
    Id: z.number(),
    Name: z.string(),
    Placement: z.number().nullable(),
    Games: z.array(z.string().nullable())
})


export const TournamentResultArraySchema = z.object({
    TournamentId: z.number(),
    Results: z.array(TournamentResultSchema)});

export type TournamentResult = z.infer<typeof TournamentResultSchema>;
export type TournamentResultArray = z.infer<typeof TournamentResultArraySchema>;
