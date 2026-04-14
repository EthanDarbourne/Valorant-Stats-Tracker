import { Request, Response, Router } from 'express';
import { DeleteTournamentRoute, FetchAllTournamentsRoute, FetchTournamentByIdRoute, PostTournamentRoute } from "../../../shared/ApiRoutes";
import pool from '../db';
import { MakeCallWithDatabaseResult, RESPONSE_CREATED, RESPONSE_INTERNAL_ERROR, RESPONSE_OK, SetResponse } from '../Helpers';
import { QueryBuilder } from '../QueryBuilder';
import { SelectTeamIdsByName, TeamIdentity } from '../TableSchemas/TeamsTable';
import { DeleteAllTournamentMatches, InsertTournamentMatches, SelectMatchesByTournamentId } from '../TableSchemas/TournamentMatchesTable';
import { DeleteResultsForTournamentId, InsertAllTournamentResult, InsertTournamentResult, GetTeamsByTournamentId as SelectPlacementsByTournamentId } from '../TableSchemas/TournamentResultsTable';
import { DeleteTournament, EntireTournament, EntireTournamentSchema, GetAllTournaments, GetTournamentById, InsertTournament, TeamInfo } from '../TableSchemas/TournamentsTable';

const router = Router();

router.get(FetchAllTournamentsRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    try {
        await qb.Connect();
        await MakeCallWithDatabaseResult(async () => await GetAllTournaments(qb), res, "GetAllTournaments");
    }
    catch (error) {
        SetResponse(res, RESPONSE_INTERNAL_ERROR);
    }
    finally {
        await qb.Disconnect();
    }
});

router.get(FetchTournamentByIdRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    try {
        await qb.Connect();
        const tournamentId = Number(req.query.TournamentId as string);
        const tournament = await GetTournamentById(qb, tournamentId);
        
        const tournamentMatches = await SelectMatchesByTournamentId(qb, tournamentId);
        const placements = await SelectPlacementsByTournamentId(qb, tournamentId);
        const fullTournament: EntireTournament = {
            ...tournament,
            Matches: tournamentMatches,
            Placements: placements.map(x => ({ TeamId: x.TeamId, Placement: x.Placement, Seed: x.Seed }))
        };
        
        const parsed = EntireTournamentSchema.safeParse(fullTournament);
        if (!parsed.success) {
            throw new Error(`Validation failed: ${parsed.error.message}`);
        }
        SetResponse(res, RESPONSE_OK, parsed.data);
    }
    catch (error) {
        console.log(error);
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { Error: "Error fetching from database by tournament Id " + req.query.id });
    }
    finally {
        await qb.Disconnect();
    }

});

router.post(PostTournamentRoute, async (req: Request, res: Response) => { 
    const qb = new QueryBuilder(pool);
    try {
        const tournament = EntireTournamentSchema.parse(req.body);
        await qb.Connect();
        await qb.BeginTransaction();

        const { Matches, Placements, ...tournamentInfo } = tournament;

        // save tournament row
        const tournamentId = await InsertTournament(qb, tournamentInfo);

        // save all placements
        console.log(Placements);
        const resultRows = Placements.map(x => ({TournamentId: tournamentId, TeamId: x.TeamId, Placement: x.Placement, Seed: x.Seed }));
        await InsertAllTournamentResult(qb, resultRows);

        // save all matches
        Matches.forEach(x => (x.TournamentId = tournamentId));
        await InsertTournamentMatches(qb, Matches);

        SetResponse(res, RESPONSE_CREATED, { message: "Created tournament successfully"});
        await qb.Commit();
    }
    catch (error) {
        console.log(error);
        await qb.Rollback();
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to create tournament" });
    }
    finally {
        await qb.Disconnect();
    }
});


// async function UpdateTournamentResults(qb: QueryBuilder, tournamentId: number, teamPlacements: TeamInfo[]): Promise<void> {
//       if (!Number.isInteger(tournamentId)) {
//         throw new Error("Invalid TournamentId");
//     }

    // // Step 1: Delete previous results
    // await DeleteResultsForTournamentId(qb, tournamentId);

    // // Step 2: Insert new results
    // const teams = await SelectTeamIdsByName(qb, teamPlacements.map(x => x.TeamName));

    // for (const team of teamPlacements) {
    //     await InsertTournamentResult(qb, {
    //         TournamentId: tournamentId,
    //         TeamId: team.TeamId,
    //         Placement: team.Placement,
    //         Seed: null
    //     });
    // }

    // console.log(`TournamentResults updated for TournamentId ${tournamentId}`);
// }

// we assume that any missing ids are for games that are already handled
function MapTeamNamesToIdsIfExist(names: string[], identities: TeamIdentity[]): number[] {
    const ids = names.map(name => identities.find(y => y.Name == name));
    if(ids.some(x => x === undefined)) throw new Error("Couldn't find id for some teams");
    return ids.filter(x => x !== undefined).map(x => x?.Id);
}

router.delete(DeleteTournamentRoute, async (req: Request, res: Response) => {
    const qb = new QueryBuilder(pool);
    
    // todo: remove reference to any games when saving VOD reviews
    try {
        await qb.Connect();
        await qb.BeginTransaction();
        const tournamentId = Number(req.query.TournamentId as string);
        await DeleteAllTournamentMatches(qb, tournamentId);
        await DeleteResultsForTournamentId(qb, tournamentId);
        await DeleteTournament(qb, tournamentId);
        await qb.Commit();
        SetResponse(res, RESPONSE_OK, { message: "Tournament successfully deleted"});
    } catch (error) {
        console.log(error);
        await qb.Rollback();
        SetResponse(res, RESPONSE_INTERNAL_ERROR, { error: "Failed to delete tournament from database" });
    } 
    finally {
        await qb.Disconnect();
    }
});

export default router;
