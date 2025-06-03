import { z } from "zod";
import { PlayerRow, PlayerRowArray, PlayersTableSchema, PlayerRowArraySchema } from "../backend/src/TableSchemas/PlayersTable"

export const PlayerSchema = PlayersTableSchema;
export const PlayerArraySchema = PlayerRowArraySchema;

export type Player = PlayerRow;
export type PlayerArray = PlayerRowArray;