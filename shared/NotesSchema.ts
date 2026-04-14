import { NoteRow, NoteArray as NoteArrayType } from "../backend/src/TableSchemas/NotesTable"
import { TagRow } from "../backend/src/TableSchemas/TagsTable"


export type Note = NoteRow;
export type NoteArray = NoteArrayType;

export type Tag = TagRow;