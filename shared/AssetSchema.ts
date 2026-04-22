import { AgentRow, AgentsSchema } from "../backend/src/TableSchemas/AgentsTable"
import { MapRow, MapsSchema } from "../backend/src/TableSchemas/MapsTable"


export type Agent = AgentRow;
export const AgentSchema = AgentsSchema;

export type Map = MapRow;
export const MapSchema = MapsSchema;