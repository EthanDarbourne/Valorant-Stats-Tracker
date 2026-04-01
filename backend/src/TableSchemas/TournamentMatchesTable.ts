import {z} from "zod"
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import { SQLComparator } from "../Helpers";

export const TournamentMatchesTableSchema = z.object({
  Id: z.number(),
  MatchId: z.string(),
  TournamentId: z.number(),
  Team1Id: z.number().nullable(),
  Team2Id: z.number().nullable(),
  WinnerId: z.number().nullable(),
  WinnerNextMatchId: z.string().nullable(),
  LoserNextMatchId: z.string().nullable(),
  Label: z.string(),
  MapCount: z.number(),
  PlayedAt: z.coerce.date().nullable(),
});

export const TournamentMatchesArraySchema = z.array(TournamentMatchesTableSchema);

export type TournamentMatchesArray = z.infer<typeof TournamentMatchesArraySchema>;
export type TournamentMatchesRow = z.infer<typeof TournamentMatchesTableSchema>;

export const TournamentMatchesColumns = makeColumnMap(TournamentMatchesTableSchema);

export const TournamentMatchesTableName = "TournamentMatches";

export async function SelectMatchesByTournamentId(qb: QueryBuilder, tournamentId: number): Promise<TournamentMatchesArray> {
    qb.SelectAll().From(TournamentMatchesTableName)
        .WhereClause().WhereSingle([TournamentMatchesColumns.TournamentId, SQLComparator.EQUAL, tournamentId]);

    const result = await qb.Execute();

    const gameRows = TournamentMatchesArraySchema.safeParse(result.rows);

    if(gameRows.success) {
        return gameRows.data;
    }
    else {
        throw new Error("Couldn't parse game array result: " + gameRows.error);
    }
}

export async function DeleteAllTournamentMatches(qb: QueryBuilder, tournamentId: number) {
    qb.Delete(TournamentMatchesTableName)
    .WhereClause().WhereSingle([TournamentMatchesColumns.TournamentId, SQLComparator.EQUAL, tournamentId]);

    await qb.Execute();
}

export async function InsertTournamentMatches(qb: QueryBuilder, matches: TournamentMatchesArray) {
    if(matches.length == 0)return;
    // id is serial and doesn't need to be inserted
    const matchesWithoutId = matches.map(x => {
        const {Id, ...withoutId} = x;
        return withoutId;
    })

    qb.Insert(TournamentMatchesTableName, Object.keys(matchesWithoutId[0]));

    matchesWithoutId.forEach(match  => {
        qb.AddValue(Object.values(match));
    });

    await qb.Execute();
}

export async function UpdateTournamentGame(qb: QueryBuilder, tournamentMatch: TournamentMatchesRow) {

    const { Id, ...withoutId } = tournamentMatch;
    qb.Update(TournamentMatchesTableName)
        .Set(Object.entries(withoutId))
        .WhereClause()
        .WhereSingle([TournamentMatchesColumns.Id, SQLComparator.EQUAL, tournamentMatch.Id]);

    await qb.Execute();
}