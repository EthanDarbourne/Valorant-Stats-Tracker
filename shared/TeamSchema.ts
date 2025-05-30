import { z } from "zod";



export const TeamSchema = z.object({
    Id: z.number(),
    Name: z.string(),
    Players: z.array(z.string()).length(5),
    Roles: z.array(z.string()).length(5),
    IGL: z.string()
})



export const TeamArraySchema = z.array(TeamSchema);

export type Team = z.infer<typeof TeamSchema>;
export type TeamArray = z.infer<typeof TeamArraySchema>;
