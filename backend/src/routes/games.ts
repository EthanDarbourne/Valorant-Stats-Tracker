import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { team_a, team_b, map, date, score } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO games (team_a, team_b, map, date, score) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [team_a, team_b, map, date, score]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;
