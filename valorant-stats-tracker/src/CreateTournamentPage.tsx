import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HomeButton from "./components/ui/HomeButton";
import { useAllTeamsByRegions, useTeamsByTeamName } from "./ApiCallers";
import { RegionList, Regions, TournamentTypeList, TournamentTypes } from "./Constants";
import { Team } from "../../shared/TeamSchema";
import { generateBracket } from "./BracketGenerator";
import { BracketMatch, BracketView } from "./BracketView";

// ─── Types ────────────────────────────────────────────────────────────────────

const swissTeamCounts = [4, 6, 8, 10, 12, 16];
const doubleElimTeamCounts = [4, 8, 12, 16];
const groupStageTeamCounts = [8, 10, 12];
const singleElimTeamCounts = [4, 8, 12, 16, 32];

// we don't handle scores here, just set up the initial bracket
interface TournamentMatchNode {
    id: number | null;
    teamA: Team | null;
    teamB: Team | null;
    winnerNextMatchId: number | null;
    loserNextMatchId: number | null;
}

const FORMAT_LABELS: Record<TournamentTypes, string> = {
    StageWithinGroup: "Regional Stage Within Your Group",
    StageOutOfGroup: "Regional Stage Outside Your Group",
    SwissIntoDoubleElim: "Swiss Into Double Elim",
    DoubleElim: "Double Elimination",
    SingleElim: "Single Elimination",
};

const FORMAT_DESCRIPTIONS: Record<TournamentTypes, string> = {
    StageWithinGroup: "Play every team in your group once",
    StageOutOfGroup: "Play every team in the other group once",
    SwissIntoDoubleElim: "Swiss Stage into double elimination bracket",
    DoubleElim: "Double Elimination Bracket",
    SingleElim: "Single Elimination Bracket",
};

// ─── Bracket generation helpers ──────────────────────────────────────────────

const isStageTournament = (format: TournamentTypes) =>
    format == TournamentTypes.StageOutOfGroup || format == TournamentTypes.StageWithinGroup;
const isElimTournament = (format: TournamentTypes) =>
    format == TournamentTypes.DoubleElim || format == TournamentTypes.SingleElim;

function getSeededCount(teamCount: number, format: TournamentTypes): number {
    if (isStageTournament(format)) {
        // no seeding for games in Stage 1 or Stage 2
        return 0;
    } else if (isElimTournament(format)) {
        if (teamCount == 12) return 4;
        else return 0;
    } else if (format == TournamentTypes.SwissIntoDoubleElim) {
        if (teamCount == 12) return 4;
        else return 0;
    }

    console.log("Didn't find tournament type");
    return 0;
}

function getSkippedSteps(format: TournamentTypes, teamCount: number): number[] {
    if (isStageTournament(format)) {
        return [3, 5];
    }
    if (isElimTournament(format)) {
        if (teamCount == 12) {
            // todo: change to isPowerOfTwo()
            return [4]; // if we have 12 teams, 4 need to get a bye
        }
        return [3, 4];
    }
    return [];
}

function generateDoubleElim(teams: (Team | null)[]): TournamentMatchNode[] {
    const n = teams.length;
    const rounds = Math.ceil(Math.log2(n));
    const matches: TournamentMatchNode[] = [];

    // Round 1
    for (let i = 0; i < n / 2; i++) {
        matches.push({
            id: null,
            teamA: teams[i * 2] ?? null,
            teamB: teams[i * 2 + 1] ?? null,
            winnerNextMatchId: null,
            loserNextMatchId: null,
        });
    }

    // Subsequent rounds
    for (let r = 2; r <= rounds; r++) {
        const matchCount = Math.pow(2, rounds - r);
        for (let i = 0; i < matchCount; i++) {
            matches.push({
                id: null,
                teamA: null,
                teamB: null,
                winnerNextMatchId: null,
                loserNextMatchId: null,
            });
        }
    }

    return matches;
}

function generateSwissRound(teams: Team[], existingMatches: TournamentMatchNode[]): TournamentMatchNode[] {
    // Simple pairing: sort by wins then pair sequentially
    const wins: Record<number, number> = {};
    teams.forEach((t) => (wins[t.Id] = 0));

    //   existingMatches.forEach(m => {
    //     if (m.winnerId !== null) wins[m.winnerId] = (wins[m.winnerId] ?? 0) + 1;
    //   });

    const sorted = [...teams].sort((a, b) => (wins[b.Id] ?? 0) - (wins[a.Id] ?? 0));
    const newMatches: TournamentMatchNode[] = [];

    for (let i = 0; i < sorted.length; i += 2) {
        newMatches.push({
            id: null,
            teamA: sorted[i],
            teamB: sorted[i + 1] ?? null,
            winnerNextMatchId: null,
            loserNextMatchId: null,
        });
    }

    return newMatches;
}

function generateGroupStage(groups: Team[][], playWithinGroup: boolean): BracketMatch[] {
    if (!playWithinGroup && groups.length !== 2) {
        console.error("Too many groups to play outside");
        return [];
    }
    function CreateMatch(team1: Team, team2: Team): BracketMatch {
        return {
            id: team1.Name + team2.Name,

            team1: team1,
            team2: team2,
            winnerNextMatchId: null,
            loserNextMatchId: null,
        };
    }

    const matches: BracketMatch[] = [];
    if (playWithinGroup) {
        groups.forEach((group) => {
            for (let a = 0; a < group.length; a++) {
                for (let b = a + 1; b < group.length; b++) {
                    matches.push(CreateMatch(group[a], group[b]));
                }
            }
        });
    } else {
        // must be 2 groups only
        const groupLen = groups[0].length;
        for (let i = 0; i < groupLen; ++i) {
            for (let j = 0; j < groupLen; ++j) {
                matches.push(CreateMatch(groups[0][i], groups[1][j]));
            }
        }
    }

    return matches;
}

const totalStepCount = 6;
const stepOrder = ["Format", "Teams", "Seeding", "Grouping", "Bracket", "Finalize"];
// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-10">
            {stepOrder.map((label, i) => {
                const step = i + 1;
                const done = step < current;
                const active = step === current;
                return (
                    <div key={step} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                                    done
                                        ? "bg-red-500 border-red-500 text-white"
                                        : active
                                          ? "bg-transparent border-red-500 text-red-400"
                                          : "bg-transparent border-gray-600 text-gray-500"
                                }`}
                            >
                                {done ? "✓" : step}
                            </div>
                            <span
                                className={`text-xs mt-1 font-medium ${
                                    active ? "text-red-400" : done ? "text-gray-300" : "text-gray-600"
                                }`}
                            >
                                {label}
                            </span>
                        </div>
                        {i < totalStepCount - 1 && (
                            <div
                                className={`w-16 h-0.5 mb-4 mx-1 transition-all duration-500 ${
                                    done ? "bg-red-500" : "bg-gray-700"
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// Step 1 — Format & Setup
function StepFormat({
    format,
    setFormat,
    teamCount,
    setTeamCount,
    name,
    setName,
}: {
    format: TournamentTypes;
    setFormat: (f: TournamentTypes) => void;
    teamCount: number;
    setTeamCount: (n: number) => void;
    name: string;
    setName: (s: string) => void;
}) {
    // todo: validate team counts
    const validCounts = (fmt: TournamentTypes) => {
        if (fmt === TournamentTypes.SwissIntoDoubleElim) return swissTeamCounts;
        if (isStageTournament(fmt)) return groupStageTeamCounts;
        if (fmt == TournamentTypes.DoubleElim) return doubleElimTeamCounts;
        return [4, 8, 16, 32];
    };

    const counts = validCounts(format);
    const tc = counts.includes(teamCount) ? teamCount : counts[0];
    if (tc !== teamCount) setTeamCount(tc);

    return (
        <div className="space-y-8">
            <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Tournament Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. VCT Champions 2025"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
                />
            </div>

            <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">Tournament Format</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {TournamentTypeList.map((fmt) => (
                        <button
                            key={fmt}
                            onClick={() => setFormat(fmt)}
                            className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                format === fmt
                                    ? "border-red-500 bg-red-500/10"
                                    : "border-gray-700 bg-gray-900 hover:border-gray-500"
                            }`}
                        >
                            {format === fmt && (
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500" />
                            )}
                            <div className="font-bold text-white mb-1">{FORMAT_LABELS[fmt]}</div>
                            <div className="text-xs text-gray-400">{FORMAT_DESCRIPTIONS[fmt]}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">Number of Teams</label>
                <div className="flex gap-3 flex-wrap">
                    {validCounts(format).map((n) => (
                        <button
                            key={n}
                            onClick={() => setTeamCount(n)}
                            className={`w-16 h-12 rounded-lg border-2 font-bold text-lg transition-all duration-200 ${
                                teamCount === n
                                    ? "border-red-500 bg-red-500/20 text-red-400"
                                    : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500"
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Step 2 — Team Selection
function StepTeamSelect({
    teamCount,
    selectedTeams,
    teamsByRegion,
    setSelectedTeams,
}: {
    teamCount: number;
    selectedTeams: string[];
    teamsByRegion: Record<string, string[]>;
    setSelectedTeams: (teams: string[]) => void;
}) {
    const [scope, setScope] = useState<string>(Regions.AMER);
    //   const [search, setSearch] = useState("");

    const filtered = teamsByRegion[scope];

    const toggle = (team: string) => {
        if (selectedTeams.find((t) => t === team)) {
            setSelectedTeams(selectedTeams.filter((t) => t !== team));
        } else if (selectedTeams.length < teamCount) {
            setSelectedTeams([...selectedTeams, team]);
        }
    };

    const isSelected = (team: string) => !!selectedTeams.find((t) => t === team);

    const clearAllSelectedTeams = () => setSelectedTeams([]);

    if (teamCount < selectedTeams.length) {
        clearAllSelectedTeams();
    }

    const tryToSelectAllTeams = () => {
        const unselectedCount = filtered.filter((x) => !isSelected(x)).length;
        if (selectedTeams.length + unselectedCount <= teamCount) {
            setSelectedTeams(selectedTeams.concat(filtered.filter((x) => !isSelected(x))));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                    <span
                        className={`font-bold ${selectedTeams.length === teamCount ? "text-green-400" : "text-red-400"}`}
                    >
                        {selectedTeams.length}
                    </span>
                    <span className="text-gray-500"> / {teamCount} teams selected</span>
                </div>
                <div className="flex gap-2">
                    {RegionList.map((s) => (
                        <button
                            key={s}
                            onClick={() => setScope(s)}
                            onDoubleClick={() => tryToSelectAllTeams()}
                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                                scope === s ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search teams..."
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
      /> */}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                {filtered.map((team) => {
                    const selected = isSelected(team);
                    const disabled = !selected && selectedTeams.length >= teamCount;
                    return (
                        <button
                            key={team}
                            onClick={() => toggle(team)}
                            disabled={disabled}
                            className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                                selected
                                    ? "border-red-500 bg-red-500/15 text-white"
                                    : disabled
                                      ? "border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed"
                                      : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {/* <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    team.Region === "international" ? "bg-blue-400" : "bg-green-400"
                  }`}
                /> */}
                                <span className="text-sm font-medium truncate">{team}</span>
                            </div>
                            {/* <div className="text-xs text-gray-500 mt-0.5 capitalize pl-4">
                {team.Region}
              </div> */}
                        </button>
                    );
                })}
            </div>

            {selectedTeams.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs uppercase tracking-widest text-gray-500">Selected</div>
                        <button
                            onClick={() => clearAllSelectedTeams()}
                            className="bg-gray-800 text-gray-400 hover:text-red-200 text-xs"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {selectedTeams.map((t) => (
                            <span
                                key={t}
                                className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-300 px-2.5 py-1 rounded-full text-xs font-medium"
                            >
                                {t}
                                <button onClick={() => toggle(t)} className="text-red-400 hover:text-red-200 ml-0.5">
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Step 3 — Seeding (drag & drop)
function StepSeeding({
    selectedTeams,
    seeds,
    setSeeds,
    teamCount,
    format,
}: {
    selectedTeams: Team[];
    seeds: (Team | null)[];
    setSeeds: (s: (Team | null)[]) => void;
    teamCount: number;
    format: TournamentTypes;
}) {
    const dragTeam = useRef<{ team: Team; fromSlot: number | null } | null>(null);
    const dragSlot = useRef<number | null>(null);

    let seededCount = getSeededCount(teamCount, format);

    const unseeded = selectedTeams.filter((t) => !seeds.find((s) => s?.Id === t.Id));

    const handleDropOnSlot = (slotIndex: number) => {
        if (!dragTeam.current) return;
        const { team, fromSlot } = dragTeam.current;
        const newSeeds = [...seeds];

        // If team came from a slot, clear that slot first
        if (fromSlot !== null) newSeeds[fromSlot] = null;

        // If there's a team already in the target slot, swap
        if (fromSlot !== null && newSeeds[slotIndex]) {
            newSeeds[fromSlot] = newSeeds[slotIndex];
        }

        newSeeds[slotIndex] = team;
        setSeeds(newSeeds);
        dragTeam.current = null;
    };

    const handleDropOnPool = () => {
        if (!dragTeam.current || dragTeam.current.fromSlot === null) return;
        const newSeeds = [...seeds];
        newSeeds[dragTeam.current.fromSlot] = null;
        setSeeds(newSeeds);
        dragTeam.current = null;
    };

    const slots = Array.from({ length: seeds.length }, (_, i) => seeds[i] ?? null);

    const handleAutoSeed = () => {
        const newSeeds = [...seeds];
        let teamIdx = 0;
        for (let i = 0; i < seeds.length; ++i) {
            if (newSeeds[i] != null) continue;
            while (newSeeds.find((s) => s?.Id === selectedTeams[teamIdx].Id)) ++teamIdx;
            newSeeds[i] = selectedTeams[teamIdx];
        }
        setSeeds(newSeeds);
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-400">
                Drag teams from the pool into seed slots. Seed 1 is the top seed. Teams in higher seeds get easier early
                matchups.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seed Slots */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs uppercase tracking-widest text-gray-500">Bracket Seeds</div>
                        <button
                            onClick={handleAutoSeed}
                            className="text-xs px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all font-medium"
                        >
                            Auto-Seed
                        </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {slots.map((team, i) => (
                            <div
                                key={i}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDropOnSlot(i)}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border-2 border-dashed transition-all ${
                                    team
                                        ? "border-red-500/50 bg-red-500/10"
                                        : "border-gray-700 bg-gray-900/50 hover:border-gray-500"
                                }`}
                            >
                                <span className="text-xs font-bold text-gray-500 w-6 text-center">#{i + 1}</span>
                                {team ? (
                                    <div
                                        draggable
                                        onDragStart={() => (dragTeam.current = { team, fromSlot: i })}
                                        className="flex-1 flex items-center gap-2 cursor-grab active:cursor-grabbing"
                                    >
                                        {/* <div
                      className={`w-2 h-2 rounded-full ${
                        team.Region === "international" ? "bg-blue-400" : "bg-green-400"
                      }`}
                    /> */}
                                        <span className="text-sm font-medium text-white">{team.Name}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-600 italic">Drop a team here</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Unseeded Pool */}
                <div>
                    <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                        Team Pool ({unseeded.length} unseeded)
                    </div>
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropOnPool}
                        className="min-h-32 space-y-2 p-3 rounded-lg bg-gray-900/30 border border-gray-800"
                    >
                        {unseeded.length === 0 ? (
                            <div className="text-xs text-gray-600 italic text-center py-4">All teams are seeded ✓</div>
                        ) : (
                            unseeded.map((team) => (
                                <div
                                    key={team.Id}
                                    draggable
                                    onDragStart={() => (dragTeam.current = { team, fromSlot: null })}
                                    className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800 border border-gray-700 cursor-grab active:cursor-grabbing hover:border-gray-500 transition-colors"
                                >
                                    {/* <div
                    className={`w-2 h-2 rounded-full ${
                      team.Region === "international" ? "bg-blue-400" : "bg-green-400"
                    }`}
                  /> */}
                                    <span className="text-sm font-medium text-gray-200">{team.Name}</span>
                                    {/* <span className="ml-auto text-xs text-gray-600 capitalize">{team.Region}</span> */}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function splitEvenly(total: number, groups: number) {
    let base = Math.floor(total / groups);
    let remainder = total % groups;

    let result = Array.from({ length: groups }, () => base);
    for (let i = 0; i < remainder; ++i) {
        result[i]++;
    }
    return result;
}

function GroupSizeSelector({
    value,
    max,
    onChange,
}: {
    value: number;
    max: number;
    onChange: (value: number) => void;
}) {
    const updateSize = (newSize: number) => {
        const clamped = Math.max(1, Math.min(max, newSize));
        onChange(clamped);
    };

    return (
        <div className="flex items-center gap-3">
            <button onClick={() => updateSize(value - 1)} disabled={value === 1}>
                −
            </button>
            <span>{value}</span>
            <button onClick={() => updateSize(value + 1)} disabled={value === max}>
                +
            </button>
        </div>
    );
}

// Step 4: Groups
function StepGroupSelection({
    teams,
    groups,
    setGroups,
}: {
    teams: Team[];
    groups: Team[][];
    setGroups: (s: Team[][]) => void;
}) {
    const dragSource = useRef<{
        team: Team;
        groupIndex: number;
        teamIndex: number;
    } | null>(null);

    const handleDrop = (toGroupIndex: number, toTeamIndex: number) => {
        if (!dragSource.current) return;
        const { team, groupIndex: fromGroup, teamIndex: fromIndex } = dragSource.current;

        // Same slot — no-op
        if (fromGroup === toGroupIndex && fromIndex === toTeamIndex) {
            dragSource.current = null;
            return;
        }

        const newGroups = groups.map((g) => [...g]);
        const targetTeam = newGroups[toGroupIndex][toTeamIndex];

        // Swap or move
        newGroups[toGroupIndex][toTeamIndex] = team;
        newGroups[fromGroup][fromIndex] = targetTeam ?? null!;

        setGroups(newGroups);
        dragSource.current = null;
    };

    const handleGroupSizeChange = (value: number) => {
        const groupLengths = splitEvenly(teams.length, value);
        const newGroups: Team[][] = [];
        let index = 0;
        groupLengths.forEach((len) => newGroups.push(Array.from({ length: len }, () => teams[index++])));
        setGroups(newGroups);
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-400">Drag teams between groups to reassign them</p>

            <div>
                <GroupSizeSelector
                    value={groups.length}
                    max={Math.floor(teams.length / 2)}
                    onChange={handleGroupSizeChange}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {groups.map((group, gi) => (
                    <div key={gi} className="space-y-2">
                        <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                            Group {String.fromCharCode(65 + gi)}{" "}
                            <span className="text-gray-600">({group.length} teams)</span>
                        </div>

                        <div className="space-y-2 p-3 rounded-lg bg-gray-900/30 border border-gray-800 min-h-24">
                            {group.map((team, ti) => (
                                <div
                                    key={team?.Id ?? `empty-${gi}-${ti}`}
                                    draggable={!!team}
                                    onDragStart={() => {
                                        if (team) dragSource.current = { team, groupIndex: gi, teamIndex: ti };
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(gi, ti)}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg border-2 border-dashed transition-all ${
                                        team
                                            ? "border-red-500/50 bg-red-500/10 cursor-grab active:cursor-grabbing hover:border-red-400/70"
                                            : "border-gray-700 bg-gray-900/50 hover:border-gray-500"
                                    }`}
                                >
                                    <span className="text-xs font-bold text-gray-500 w-5 text-center">{ti + 1}</span>
                                    {team ? (
                                        <span className="text-sm font-medium text-white">{team.Name}</span>
                                    ) : (
                                        <span className="text-xs text-gray-600 italic">Empty slot</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StepBracket({ matches, setMatches }: { matches: BracketMatch[]; setMatches: (m: BracketMatch[]) => void }) {
    return <BracketView matches={matches} onChange={setMatches} />;
}

// final step: make sure everything is okay
function StepFinalize({
    format,
    seeds,
    groups,
    matches,
    teamCount,
}: {
    format: TournamentTypes;
    seeds: (Team | null)[];
    groups: Team[][];
    matches: BracketMatch[]; // replace with your bracket type
    teamCount: number;
}) {
    const hasSeeds = seeds && seeds.some((s) => s !== null);
    const hasGroups = groups && groups.length > 0;
    const hasMatches = matches && matches.length > 0;

    return (
        <div className="space-y-8">
            <p className="text-sm text-gray-400">Review your tournament setup before creating.</p>

            {/* ── Tournament Format ── */}
            <section className="space-y-3">
                <div className="text-xs uppercase tracking-widest text-gray-500">Tournament Format</div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                    {/* Swap the icon/label to match your TournamentTypes values */}
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-white capitalize">{format}</span>
                    <span className="ml-auto text-xs text-gray-500">{teamCount} teams</span>
                </div>
            </section>

            {/* ── Seeds ── */}
            {hasSeeds && (
                <section className="space-y-3">
                    <div className="text-xs uppercase tracking-widest text-gray-500">Seeds</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                        {seeds.map((team, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                                    team
                                        ? "border-red-500/30 bg-red-500/5"
                                        : "border-gray-800 bg-gray-900/30 opacity-40"
                                }`}
                            >
                                <span className="text-xs font-bold text-gray-500 w-6 text-center">#{i + 1}</span>
                                <span className="text-sm font-medium text-white">
                                    {team ? team.Name : <span className="text-gray-600 italic">TBD</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Groups ── */}
            {hasGroups && (
                <section className="space-y-3">
                    <div className="text-xs uppercase tracking-widest text-gray-500">Groups</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map((group, gi) => (
                            <div key={gi} className="rounded-lg bg-gray-900/40 border border-gray-800 overflow-hidden">
                                <div className="px-3 py-2 bg-gray-800/60 border-b border-gray-700">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                        Group {String.fromCharCode(65 + gi)}
                                    </span>
                                </div>
                                <div className="p-2 space-y-1">
                                    {group.map((team, ti) => (
                                        <div
                                            key={team?.Id ?? ti}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-800/50 transition-colors"
                                        >
                                            <span className="text-xs text-gray-600 w-4">{ti + 1}.</span>
                                            <span className="text-sm text-gray-200">{team?.Name ?? "—"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Bracket ── */}
            {hasMatches && (
                <section className="space-y-3">
                    <div className="text-xs uppercase tracking-widest text-gray-500">
                        {matches.length} Matches generated
                    </div>
                    {/* <div className="rounded-lg bg-gray-900/40 border border-gray-800 p-4 min-h-48 flex items-center justify-center">
            <span className="text-xs text-gray-600 italic">
              Bracket preview goes here
            </span>
          </div> */}
                </section>
            )}

            {/* ── No data fallback ── */}
            {!hasSeeds && !hasGroups && !hasMatches && (
                <div className="text-center py-12 text-gray-600 text-sm italic">
                    No additional configuration to display.
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CreateTournamentPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [format, setFormat] = useState<TournamentTypes>(TournamentTypes.DoubleElim);
    const [teamCount, setTeamCount] = useState(8);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [seeds, setSeeds] = useState<(Team | null)[]>(Array(teamCount).fill(null));
    const [groups, setGroups] = useState<Team[][]>([]);
    const [matches, setMatches] = useState<BracketMatch[]>([]);
    const [saving, setSaving] = useState(false);
    const [skippedSteps, setSkippedSteps] = useState<number[]>([]);

    useEffect(() => {
        setSkippedSteps(getSkippedSteps(format, teamCount));
    }, [format, teamCount]);

    const teamsByRegion = useAllTeamsByRegions(RegionList);

    const teams = useTeamsByTeamName(selectedTeams);

    const canProceed = () => {
        if (step === 1) return name.trim().length > 0;
        if (step === 2) return selectedTeams.length === teamCount;
        if (step === 3) return seeds.filter(Boolean).length === seeds.length;
        return true;
    };

    const handleNext = () => {
        let nextStep = step + 1;
        // if (step === 3) {

        //   // Generate initial bracket
        //   const seededTeams = seeds.filter((s): s is Team => s !== null);
        //   let generated: TournamentMatchNode[] = [];
        // //   if (isStageTournament(format)) {
        // //     generated = generateGroupStage(seededTeams);
        // //   }
        // // else if (format === "swiss") {
        // //     generated = generateSwissRound(seededTeams, [], 1);
        // //   } else if (format === "group_stage") {
        // //     generated = generateGroupStage(seededTeams);
        // //   }
        //   setMatches(generated);
        // }
        if (step === 1) {
            setSeeds(Array(teamCount).fill(null));
        }
        const seededCount = getSeededCount(teamCount, format);
        if (step === 2) {
            setSeeds(Array(seededCount).fill(null));
            if (seededCount == 0) {
                nextStep++; // skip the seeding step
            }
        }
        if (step == 4) {
            if (isStageTournament(format)) {
                nextStep++; // skip the bracket step
                let generated: BracketMatch[] = generateGroupStage(groups, format == TournamentTypes.StageWithinGroup);
                setMatches(generated); // these are the only matches for a stage tournament
            }
        }
        while (skippedSteps.includes(nextStep)) {
            nextStep++;
        }
        if (nextStep == 3) {
            // seeding
            console.log("Setting", seededCount);
            setSeeds(Array.from({ length: seededCount }, () => null));
        }
        if (nextStep == 4) {
            // Grouping
            let index = 0;
            const seededTeams = teams.filter((t) => !seeds.find((s) => s?.Id === t.Id));
            setGroups([Array.from({ length: teamCount - seededCount }, () => seededTeams[index++])]);
        }
        if (nextStep == 5) {
            // Bracket
            // generate the games for the bracket
            const tmp = generateBracket({ teams, format, byeTeams: seeds.filter((x) => x !== null) });
            console.log("Setting matches", tmp);
            setMatches(tmp);
        }
        setStep(nextStep);
    };

    const handleBack = () => {
        let nextStep = step - 1;
        while (skippedSteps.includes(nextStep)) {
            nextStep--;
        }
        setStep(nextStep);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // TODO: replace with your actual API call
            // await createTournament({ name, format, teamCount, seeds, matches });
            console.log("Saving tournament:", { name, format, teamCount, seeds, matches });
            await new Promise((r) => setTimeout(r, 800)); // mock delay
            navigate("/add-tournaments");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen w-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">Create Tournament</h1>
                        {name && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {name} · {FORMAT_LABELS[format]}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => navigate("/add-tournaments")}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        ← Back to Tournaments
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <StepIndicator current={step} />

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 min-h-64">
                    {step === 1 && (
                        <StepFormat
                            format={format}
                            setFormat={setFormat}
                            teamCount={teamCount}
                            setTeamCount={setTeamCount}
                            name={name}
                            setName={setName}
                        />
                    )}
                    {step === 2 && (
                        <StepTeamSelect
                            teamCount={teamCount}
                            selectedTeams={selectedTeams}
                            teamsByRegion={teamsByRegion}
                            setSelectedTeams={setSelectedTeams}
                        />
                    )}
                    {step === 3 && (
                        <StepSeeding
                            selectedTeams={teams}
                            seeds={seeds}
                            setSeeds={setSeeds}
                            teamCount={teamCount}
                            format={format}
                        />
                    )}
                    {step === 4 && (
                        <StepGroupSelection
                            teams={teams.filter((t) => !seeds.find((s) => s?.Id === t.Id))}
                            groups={groups}
                            setGroups={setGroups}
                        />
                    )}
                    {step === 5 && (
                        <StepBracket
                            //   format={format}
                            matches={matches}
                            setMatches={setMatches}
                            //   teams={teams}
                            //   seeds={seeds}
                        />
                    )}
                    {step === 6 && (
                        <StepFinalize
                            format={format}
                            seeds={seeds}
                            groups={groups}
                            matches={matches}
                            teamCount={teamCount}
                        />
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className="px-5 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                        ← Back
                    </button>

                    <div className="text-xs text-gray-600">
                        Step {step} of {totalStepCount}
                    </div>

                    {step < totalStepCount ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="px-6 py-2.5 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-all"
                        >
                            {saving ? "Saving…" : "Save Tournament"}
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pb-8">
                <HomeButton />
            </div>
        </div>
    );
}
