import { z } from "zod";
import { Team, TeamArray, TeamArraySchema, TeamSchema } from "../../../shared/TeamSchema";
import { SQLComparator } from "../Helpers";
import { QueryBuilder } from "../QueryBuilder";
import { TeamIdentity } from "./TeamsTable";
import { makeColumnMap } from "./MakeCol";

// If you want to update this PlayersTableSchema, we also need to update TeamSchema.TeamSchema
// to avoid "Type instantiation is excessively deep and possibly infinite" error in zod objects
export const PlayersTableSchema = z.object({
  Id: z.number(),
  TeamId: z.number().nullable(),
  Name: z.string(),
  Role: z.string(),
  IGL: z.boolean()
})

export const PlayerRowArraySchema = z.array(PlayersTableSchema);

export type PlayerRow = z.infer<typeof PlayersTableSchema>;
export type PlayerRowArray = z.infer<typeof PlayerRowArraySchema>;
export const PlayersColumns = makeColumnMap(PlayersTableSchema);
export const PlayersTableName = "Players";

export async function SelectPlayersOnTeam(qb: QueryBuilder, teamId: number): Promise<PlayerRowArray> {
    qb.SelectAll()
        .From(PlayersTableName)
        .WhereClause()
        .WhereSingle( [PlayersColumns.TeamId, SQLComparator.EQUAL, teamId])

    const result = await qb.Execute();

    return PlayerRowArraySchema.parse(result.rows);
}

export async function SelectPlayersWithoutTeam(qb: QueryBuilder): Promise<PlayerRowArray> {
    qb.SelectAll()
        .From(PlayersTableName)
        .WhereClause()
        .WhereNull( PlayersColumns.TeamId )

    const result = await qb.Execute();

    return PlayerRowArraySchema.parse(result.rows);
}

export async function AddPlayersToTeam(qb: QueryBuilder, team: TeamIdentity): Promise<Team> {
    const allPlayers = SelectPlayersOnTeam(qb, team.Id);

    const fullTeam: Team = TeamSchema.parse({
        Id: team.Id,
        Name: team.Name,
        Region: team.Region,
        Players: allPlayers
    });
    return fullTeam;
}


export async function AddPlayersToTeams(qb: QueryBuilder, teams: TeamIdentity[]): Promise<TeamArray> {
    if(teams.length == 0)return [];

    qb.SelectAll()
        .From(PlayersTableName)
        .WhereClause();
    
    teams.forEach((team, index) => {
        if(index > 0)qb.WhereOp(SQLComparator.OR);
        qb.WhereSingle( [PlayersColumns.TeamId, SQLComparator.EQUAL, team.Id])
    });

    const result = await qb.Execute();

    const allPlayers = PlayerRowArraySchema.parse(result.rows);

    const fullTeams: TeamArray = TeamArraySchema.parse(teams.map(x => ({
        Id: x.Id,
        Name: x.Name,
        Region: x.Region,
        Players: allPlayers.filter(y => y.TeamId == x.Id)
    })));
    return fullTeams;
}

export async function InsertOrUpdatePlayer(qb: QueryBuilder, player: PlayerRow) {
    if(player.Name == "") return;
    if(player.Id < 0) {
        // insert player
        const { Id, ...playerWithoutId } = player;
        qb.Insert(PlayersTableName, Object.keys(playerWithoutId))
            .AddValue(Object.values(playerWithoutId));
    }
    else {
        // update player
        qb.Update(PlayersTableName)
            .Set(([[PlayersColumns.Name, player.Name], [PlayersColumns.Role, player.Role],
                [PlayersColumns.IGL, player.IGL], [PlayersColumns.TeamId, player.TeamId]]))
            .Where([[PlayersColumns.Id, SQLComparator.EQUAL, player.Id]])

    }
    await qb.Execute();
}

export async function UpdatePlayersInTeam(qb: QueryBuilder, team: Team) {

    let curPlayers = await SelectPlayersOnTeam(qb, team.Id);
    for(let player of team.Players) {
        curPlayers = curPlayers.filter(x => x.Id != player.Id);
        await InsertOrUpdatePlayer(qb, player);
    }
    // if we do not update an old player, we must be removing them from team, so set teamId to null
    for(let oldPlayers of curPlayers) {
        qb.Update(PlayersTableName)
            .Set([[PlayersColumns.TeamId, null]])
            .Where([[PlayersColumns.Id, SQLComparator.EQUAL, oldPlayers.Id]])
        await qb.Execute();
    }
}