import express from 'express';
import cors from 'cors';
import mapsRouter from './routes/Maps';
import teamsRouter from './routes/Teams';
import tournamentsRouter from './routes/Tournaments';
import gamesRouter from './routes/Games';
import playersRouter from './routes/Players';
import agentsRouter from './routes/Agents';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', mapsRouter);
app.use('/', teamsRouter);
app.use('/', tournamentsRouter);
app.use('/', gamesRouter);
app.use('/', playersRouter);
app.use('/', agentsRouter);

app.use((req, res) => {
  res.status(404).send(`Route not found: ${req.method} ${req.originalUrl}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
