import { Router, Request, Response } from 'express';
import { GenerateSelectStatement, GetFromDatabase, AddWhereClause, GenerateSelectAllStatement } from '../Select';
import { InsertToDatabase, UpdateInDatabase } from "../Insert";
import { TournamentSchema } from '../TournamentSchema';

const router = Router();

router.get('/api/tournaments', async (req: Request, res: Response) => {
    const query = GenerateSelectStatement("Tournaments", ["Name"]);
    await GetFromDatabase(query, res);
});

router.get('/api/tournamentById', async (req: Request, res: Response) => {
    const id = Number(req.query.id as string);
    const query = AddWhereClause(
        GenerateSelectAllStatement("Tournaments"),
        `WHERE "Id" = '${id}'`
    );
    await GetFromDatabase(query, res);
});


router.post("/api/saveTournament", async (req: Request, res: Response) => {
  const parsed = TournamentSchema.safeParse(req.body);

  console.log("Received: ", parsed);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid tournament data", details: parsed.error.errors });
    return;
  }

  try {
    if(parsed.data.id == "") {
      const { id, ...tournamentDataWithoutId } = parsed.data; // id is serial and doesn't need to be inserted
      parsed.data.id = await InsertToDatabase("tournaments", tournamentDataWithoutId);
    }
    else {
      await UpdateInDatabase("tournaments", parsed.data);
    }

    res.status(201).json({ message: "Tournament created successfully" , id: parsed.data.id });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Failed to insert tournament into database" });
  }
});

export default router;
