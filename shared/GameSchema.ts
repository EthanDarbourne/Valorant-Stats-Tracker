import { z } from "zod";



export const GameSchema = z.object({
    Id: z.number(),
    TournamentId: z.number(),
    TeamNameA: z.string(),
    TeamNameB: z.string(),
    WinnerName: z.string().nullable(),
    MatchNumber: z.number(),
    MapCount: z.number(),
    PlayedAt: z.coerce.date()
})



export const GameArraySchema = z.array(GameSchema);

export type Game = z.infer<typeof GameSchema>;
export type GameArray = z.infer<typeof GameArraySchema>;
