import { Request, Response, Router } from "express";
import { FetchAllNotes, FetchAllTags, PostNotes, PostTags } from "../../../shared/ApiRoutes";
import pool from "../db";
import { MakeCallWithDatabaseResult, RESPONSE_INTERNAL_ERROR, RESPONSE_OK, SetResponse } from "../Helpers";
import { QueryBuilder } from "../QueryBuilder";
import { GetAllNotes, InsertNotes, NoteArraySchema } from "../TableSchemas/NotesTable";
import { GetAllTags, InsertTags, TagArraySchema } from "../TableSchemas/TagsTable";

const router = Router();

router.get(FetchAllNotes, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
        await MakeCallWithDatabaseResult(async () => await GetAllNotes(qb), res, "FetchAllNotes");
});

router.post(PostNotes, async (req: Request, res: Response) => {

    const qb = new QueryBuilder(pool);
    try {
        const notes = NoteArraySchema.parse(req.body);
        await qb.Connect();
        await qb.BeginTransaction();

        await InsertNotes(qb, notes);
        
        SetResponse(res, RESPONSE_OK, { message: "Inserted notes successfully"});
        await qb.Commit();
    }
    catch (error) {
        console.log(error);
        await qb.Rollback();
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to insert notes into database" });
    }
    finally {
        await qb.Disconnect();
    }
});

router.get(FetchAllTags, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    await MakeCallWithDatabaseResult(async () => await GetAllTags(qb), res, "FetchAllTags");
});

router.post(PostTags, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    try {
        const tags = TagArraySchema.parse(req.body);
        await qb.Connect();
        await qb.BeginTransaction();

        await InsertTags(qb, tags);
        
        SetResponse(res, RESPONSE_OK, { message: "Inserted tags successfully"});
        await qb.Commit();
    }
    catch (error) {
        console.log(error);
        await qb.Rollback();
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to insert tags into database" });
    }
    finally {
        await qb.Disconnect();
    }
});

export default router;