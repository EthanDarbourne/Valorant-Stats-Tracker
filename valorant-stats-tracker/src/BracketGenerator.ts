import { Team } from "../../shared/TeamSchema";
import { BracketMatch } from "./BracketView";
import { TournamentTypes } from "./Constants";
import { zipArrays } from "./Utilities";

let _idCounter = 0;
const uid = (prefix: string) => `${prefix}-${++_idCounter}`;
const nextPow2 = (n: number) => {
    let p = 1;
    while (p < n) p <<= 1;
    return p;
};

// Seeded ordering so 1v2 can only happen in the final
function seededSlots(size: number): number[] {
    let slots = [1, 2];
    while (slots.length < size) {
        const next: number[] = [];
        const total = slots.length * 2 + 1;
        for (const s of slots) next.push(s, total - s);
        slots = next;
    }
    return slots;
}

// ─── Winners bracket ──────────────────────────────────────────────────────────
// Returns rounds as separate arrays so losers bracket can reference each round's losers.

function buildWinners(slots: (Team | null)[], isBye: boolean[]): BracketMatch[][] {
    const size = slots.length; // power of 2
    const rounds: BracketMatch[][] = [];
    const byeTeams = zipArrays(slots, isBye)
        .filter((x) => x[1])
        .map((x) => x[0]);
    // Round 1
    const r1: BracketMatch[] = [];
    for (let i = 0; i < size; i += 2) {
        const bye = isBye[i] || isBye[i + 1];
        if (bye) continue;
        r1.push({
            id: uid("w"),
            team1: slots[i],
            team2: slots[i + 1],
            isBye: false,
            winnerNextMatchId: null,
            loserNextMatchId: null,
        });
    }
    rounds.push(r1);

    // Remaining rounds — each match's two feeders come from the previous round
    let prev = r1;

    // handle bye round
    if (byeTeams.length > 0) {
        if (prev.length != byeTeams.length) {
            console.log(prev.length, byeTeams.length);
            throw new Error("There are not enough teams receiving byes for this bracket");
        }
        const round: BracketMatch[] = [];
        for (let i = 0; i < prev.length; ++i) {
            const m: BracketMatch = {
                id: uid("w"),
                team1: byeTeams[i],
                team2: null,
                isBye: false,
                winnerNextMatchId: null,
                loserNextMatchId: null,
            };
            prev[i].winnerNextMatchId = m.id;
            round.push(m);
        }
        rounds.push(round);
        prev = round;
    }

    while (prev.length > 1) {
        const round: BracketMatch[] = [];
        for (let i = 0; i < prev.length; i += 2) {
            const m: BracketMatch = {
                id: uid("w"),
                team1: null,
                team2: null,
                isBye: false,
                winnerNextMatchId: null,
                loserNextMatchId: null,
            };
            prev[i].winnerNextMatchId = m.id;
            prev[i + 1].winnerNextMatchId = m.id;
            round.push(m);
        }
        rounds.push(round);
        prev = round;
    }

    return rounds;
}

// ─── Losers bracket ───────────────────────────────────────────────────────────
//
// For a bracket of size N (power of 2), winners bracket has log2(N) rounds.
// Losers bracket structure interleaves "drop" rounds and "consolidation" rounds:
//
//   W round 1 losers  → L round 1 (drop-in pairs)
//   L round 1 winners → L round 2 vs W round 2 losers  (consolidation)
//   L round 2 winners → L round 3 (internal)
//   L round 3 winners → L round 4 vs W round 3 losers
//   ...
//
// The pattern: for each W round after round 1, losers drop into the L bracket.
// Between each drop there's a consolidation round.
// if there are x teams receiving byes, losers bracket first round is built up of first round and second round


// if bracket size=8, we have 2 loser games. if bracket size=16, we have 4 loser games.
// if there are teams with byes, losers come from first two rounds, otherwise just from first round
function buildLosers(wRounds: BracketMatch[][], bracketSize: number, byeCount: number): BracketMatch[][] {
    // wRounds[0] = W round 1 (most matches), wRounds[last] = W grand final
    // Losers come from W rounds 0..n-2 (not the W final — that loser goes to GF reset)
    const lRounds: BracketMatch[][] = [];
    const lr1: BracketMatch[] = [];
    let wIdx = 0;
    if (byeCount > 0) {
        // first round comes from first two rounds of winners
        // but then next round is between teams already in lowers
        if(wRounds[0].length != wRounds[1].length) {
            throw new Error("Number of matches in each round do not match up")
        }
        for(let i = 0; i < wRounds[0].length; ++i) {
            const m: BracketMatch = {
                id: uid("l"),
                team1: null,
                team2: null,
                isBye: false,
                winnerNextMatchId: null,
                loserNextMatchId: null,
            };
            wRounds[0][i].loserNextMatchId = m.id;
            wRounds[1][i].loserNextMatchId = m.id;
            lr1.push(m);
        }
        lRounds.push(lr1);
        
        const nextRound: BracketMatch[] = [];
        for(let i = 0; i < lr1.length; i += 2) {
            const m: BracketMatch = {
                id: uid("l"),
                team1: null,
                team2: null,
                isBye: false,
                winnerNextMatchId: null,
                loserNextMatchId: null,
            };
            lr1[i].loserNextMatchId = m.id;
            lr1[i + 1].loserNextMatchId = m.id;
            nextRound.push(m);
        }
        wIdx += 2;
        lRounds.push(nextRound);
    }
    else {
        // L round 1: losers from W round 1 pair up
        const wr1Losers = wRounds[wIdx];
        for (let i = 0; i < wr1Losers.length; i += 2) {
            const m: BracketMatch = {
                id: uid("l"),
                team1: null,
                team2: null,
                isBye: false,
                winnerNextMatchId: null,
                loserNextMatchId: null,
            };
            wr1Losers[i].loserNextMatchId = m.id;
            wr1Losers[i + 1].loserNextMatchId = m.id;
            lr1.push(m);
        }
        wIdx++;
        lRounds.push(lr1);
    }
    console.log(lRounds);
    console.log(wRounds, wIdx);
    let prevLRound = lRounds[lRounds.length - 1];
    // For each subsequent W round (except the final), drop losers in
    for (; wIdx < wRounds.length; wIdx++) {
        const dropIns = wRounds[wIdx]; // losers from this W round

        // Consolidation: prevLRound winners vs dropIns losers
        // prevLRound.length should equal dropIns.length at each stage
        const consRound: BracketMatch[] = [];
        for (let i = 0; i < prevLRound.length; i++) {
            const m: BracketMatch = {
                id: uid("l"),
                team1: null,
                team2: null,
                isBye: false,
                winnerNextMatchId: null,
                loserNextMatchId: null,
            };
            prevLRound[i].winnerNextMatchId = m.id;
            dropIns[i].loserNextMatchId = m.id;
            consRound.push(m);
        }
        lRounds.push(consRound);

        // If more than one match, add an internal round to halve the field
        if (consRound.length > 1) {
            const internalRound: BracketMatch[] = [];
            for (let i = 0; i < consRound.length; i += 2) {
                const m: BracketMatch = {
                    id: uid("l"),
                    team1: null,
                    team2: null,
                    isBye: false,
                    winnerNextMatchId: null,
                    loserNextMatchId: null,
                };
                consRound[i].winnerNextMatchId = m.id;
                consRound[i + 1].winnerNextMatchId = m.id;
                internalRound.push(m);
            }
            lRounds.push(internalRound);
            prevLRound = internalRound;
        } else {
            prevLRound = consRound;
        }
    }

    return lRounds;
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateBracket({
    teams,
    format,
    byeTeams = [],
}: {
    teams: Team[];
    format: TournamentTypes;
    byeTeams?: Team[];
}): BracketMatch[] {
    _idCounter = 0; // reset so IDs are deterministic per generation

    const playInTeams = teams.filter((t) => !byeTeams.find((b) => b.Id === t.Id));
    const byeCount = byeTeams.length;
    const playInCount = playInTeams.length;

    // Bracket size = next power of 2 that fits bye teams + play-in winners
    // Each pair of play-in teams produces 1 winner, so we need ceil(playInCount/2) extra slots
    const bracketSize = nextPow2(byeCount + Math.ceil(playInCount / 2) + 1);

    // Build team slot array using seeded ordering
    // Bye teams take the top seeds; play-in teams fill the rest in pairs
    const order = seededSlots(bracketSize); // e.g. [1,8,5,4,3,6,7,2] for size=8
    const slots: (Team | null)[] = new Array(bracketSize).fill(null);
    const isBye: boolean[] = new Array(bracketSize).fill(false);

    // Place bye teams at seed positions 1..byeCount
    for (let i = 0; i < byeCount; i++) {
        const slotIdx = order.indexOf(i + 1);
        slots[slotIdx] = byeTeams[i];
        isBye[slotIdx] = true;
    }

    // Place play-in teams into the remaining slots
    // Non-bye slots come in pairs — each pair is a round-1 play-in match
    const openSlots = order
        .map((seed, idx) => ({ seed, idx }))
        .filter(({ seed }) => seed > byeCount)
        .sort((a, b) => a.seed - b.seed)
        .map(({ idx }) => idx);

    for (let i = 0; i < openSlots.length; i++) {
        slots[openSlots[i]] = playInTeams[i] ?? null;
    }

    // Build winners bracket rounds
    const wRounds = buildWinners(slots, isBye);
    const wFlat = wRounds.flat();

    if (format === TournamentTypes.SingleElim) {
        return wFlat;
    }

    // Build losers bracket
    const lRounds = buildLosers(wRounds, bracketSize, byeCount);
    const lFlat = lRounds.flat();

    // Grand final: W finalist vs L finalist
    const wFinal = wRounds[wRounds.length - 1][0];
    const lFinal = lRounds[lRounds.length - 1][0];
    const gf: BracketMatch = {
        id: uid("gf"),
        team1: null,
        team2: null,
        isBye: false,
        winnerNextMatchId: null,
        loserNextMatchId: null,
        label: "Grand Final",
    };
    wFinal.winnerNextMatchId = gf.id;
    lFinal.winnerNextMatchId = gf.id;

    return [...wFlat, ...lFlat, gf];
}
