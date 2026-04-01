import { toInputDateString } from "./Helpers";
import { z } from "zod";
import { TournamentsTableSchema, TournamentRow, TournamentRowArraySchema, EntireTournamentSchema as EntireTournamentSchemaCopy, EntireTournament as EntireTournamentCopy } from "../backend/src/TableSchemas/TournamentsTable"


export const TournamentInfoSchema = TournamentsTableSchema;
export type TournamentInfo = TournamentRow;

export const EntireTournamentSchema = EntireTournamentSchemaCopy;
export type EntireTournament = EntireTournamentCopy;
// export const EntireTournamentScshema = EntireTournamentSchema;

// export type EntireTournament = z.infer<typeof EntireTournamentSchema>;
export const TournamentInfoArraySchema = TournamentRowArraySchema;

// export type TeamInfo = z.infer<typeof TeamInfoSchema>;
// export type TournamentInfo = z.infer<typeof TournamentInfoSchema>;
// export type TournamentArray = z.infer<typeof TournamentArraySchema>;

export function FixDates(data: any) {
  return ({...data,
      StartDate: toInputDateString(data.StartDate),
      EndDate: toInputDateString(data.EndDate),
      });
}

export function FixDatesInArray(data: any[]) {
  return data.map(x => ({
      ...x,
      StartDate: toInputDateString(x.StartDate),
      EndDate: toInputDateString(x.EndDate),
      }));
}

export const DefaultTournament = {       
    Id: -1,
    Name: "",
    Format: "",
    Location: "",
    StartDate: null,
    EndDate: null,
    Completed: false,
    Winner: null,
    Placements: [],
    Matches: []
}