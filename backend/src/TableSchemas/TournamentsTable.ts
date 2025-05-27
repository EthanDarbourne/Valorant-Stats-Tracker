import {z} from "zod"
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";
import pool from "../db";
import { SQLComparator } from "../Helpers";
import { FixDates } from "../../../shared/TournamentSchema";

export const TournamentsTableSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  Location: z.string(),
  StartDate: z.string(),
  EndDate: z.string(),
  Completed: z.boolean(),
  Winner: z.number().nullable(),
});

export const TournamentRowArraySchema = z.array(TournamentsTableSchema);

export type TournamentRow = z.infer<typeof TournamentsTableSchema>;
export type TournamentRowArray = z.infer<typeof TournamentRowArraySchema>;
export const TournamentColumns = makeColumnMap(TournamentsTableSchema);

export const TournamentsTableName = "Tournaments";

export async function GetAllTournaments(): Promise<TournamentRow[]> {
    const qb = new QueryBuilder();

    qb.SelectAll().From(TournamentsTableName);

    const result = await qb.Execute(pool);
    return TournamentRowArraySchema.parse(result.rows.map(FixDates));
}

export async function GetTournamentById(id: number): Promise<TournamentRow> {
    const qb = new QueryBuilder();

    qb.SelectAll().From(TournamentsTableName)
        .WhereClause()
        .WhereSingle([TournamentColumns.Id, SQLComparator.EQUAL, id]);

    const result = await qb.Execute(pool);
    if(result.rowCount == 0) {
        throw new Error("Didn't find tournament with id: " + id.toString());
    }
    return TournamentsTableSchema.parse(FixDates(result.rows[0]));
}

export async function InsertTournament(tournament: TournamentRow) {
    const qb = new QueryBuilder();
    // id is serial and doesn't need to be inserted
    const { Id, ...tournamentRowWithoutId } = tournament;

    qb.Insert(TournamentsTableName, Object.keys(tournamentRowWithoutId))
        .AddValue(Object.values(tournamentRowWithoutId))
        .GetReturnValue(TournamentColumns.Id);

    const result = await qb.Execute(pool);
    return Number(result.rows[0][TournamentColumns.Id]);
}

export async function UpdateTournament(tournament: TournamentRow) {
    const qb = new QueryBuilder();
    // id is serial and doesn't need to be inserted
    const { Id, ...tournamentRowWithoutId } = tournament;

    qb.Update(TournamentsTableName)
        .Set(Object.entries(tournamentRowWithoutId))
        .WhereClause()
        .WhereSingle([TournamentColumns.Id, SQLComparator.EQUAL, tournament.Id]);

    await qb.Execute(pool);
}