import { z } from "zod";
import { makeColumnMap } from "./MakeCol";
import { QueryBuilder } from "../QueryBuilder";

export const NoteTableSchema = z.object({
  Id: z.number(),
  Category: z.string(),
  Header: z.string(),
  Body: z.string(),
  Tags: z.array(z.string()),
  Keywords: z.array(z.string()),
  CreatedAt: z.coerce.date()
})

export type NoteRow = z.infer<typeof NoteTableSchema>;

export const NoteArraySchema = z.array(NoteTableSchema);
export type NoteArray = z.infer<typeof NoteArraySchema>;

export const NoteColumns = makeColumnMap(NoteTableSchema);
export const NoteTableName = "Notes";


export async function GetAllNotes(qb: QueryBuilder): Promise<string[]> {

  qb.SelectAll()
    .From(NoteTableName);
  
  const result = await qb.Execute();
  return result.rows;
}

export async function InsertNotes(qb: QueryBuilder, notes: NoteArray) {
    const notesWithoutId = notes.map(x => {
        const {Id, ...withoutId} = x;
        return withoutId;
    })

    qb.Insert(NoteTableName, Object.keys(notesWithoutId[0]));

    notesWithoutId.forEach(note  => {
        qb.AddValue(Object.values(note));
    });

    await qb.Execute();
}

/*

Indexing in DB:

CREATE TABLE answers (
  id          SERIAL PRIMARY KEY,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,           -- your paragraph content
  tags        TEXT[],                  -- array of tags
  keywords    TEXT[],                  -- array of keywords
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fast tag/keyword queries
CREATE INDEX idx_tags     ON answers USING GIN(tags);
CREATE INDEX idx_keywords ON answers USING GIN(keywords);

-- Full-text search index
CREATE INDEX idx_fts ON answers USING GIN(to_tsvector('english', answer));


-- Find by tag
SELECT * FROM answers WHERE 'machine-learning' = ANY(tags);

-- Full-text search within answers
SELECT * FROM answers WHERE to_tsvector('english', answer) @@ to_tsquery('neural & network');
*/