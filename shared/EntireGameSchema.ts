
import { z } from "zod"

export const RoundSchema = z.object({
    GameId: z.number(),
    RoundNumber: z.number(),
    RoundWinnerId: z.number(),
    Notes: z.string(),
    Events: z.array(z.string()),
});

export type RoundInfo = z.infer<typeof RoundSchema>;

export const StatLineSchema = z.object({
    Kills: z.number(),
    Deaths: z.number(),
    Assists: z.number(),
})

export type StatLine = z.infer<typeof StatLineSchema>

export const PlayerStatsSchema = z.object({
    TeamId: z.number(),
    PlayerId: z.number(),
    Agent: z.string(),
    FirstHalfStats: StatLineSchema,
    TotalStats: StatLineSchema,
});

export type PlayerStats = z.infer<typeof PlayerStatsSchema>

export const RankedPlayerStatsSchema = z.object({
    IsPlayer: z.boolean(),
    FirstHalfStats: StatLineSchema.optional(),
    TotalStats: StatLineSchema,
    Agent: z.string(),
})

export const FullTeamSchema = z.object({
    TeamId: z.number(),
    DefendingFirst: z.boolean(),
    Players: z.array(PlayerStatsSchema).max(5),
})

export const TournamentMapSchema = z.object({
    TournamentId: z.number(),
    GameId: z.number(),
    TeamA: FullTeamSchema,
    TeamB: FullTeamSchema,
    MapNumber: z.number(),
    MapName: z.string(),
    Date: z.string(),
    Rounds: z.array(RoundSchema),
})

export type TournamentMap = z.infer<typeof TournamentMapSchema>
export type OtherMap = z.infer<typeof OtherMapSchema>

export const OtherMapSchema = z.object({

})