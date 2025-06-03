import { z } from "zod";

export const TeamSchema = z.object({
    Id: z.number(),
    Name: z.string(),
    Region: z.string(),
    Players: z.array(z.object({ // this is the same object as PlayersTableSchema, needs to be updated with it
      Id: z.number(),
      TeamId: z.number(),
      Name: z.string(),
      Role: z.string(),
      IGL: z.boolean()
    })).max(5)
})



export const TeamArraySchema = z.array(TeamSchema);

export type Team = z.infer<typeof TeamSchema>;
export type TeamArray = z.infer<typeof TeamArraySchema>;
