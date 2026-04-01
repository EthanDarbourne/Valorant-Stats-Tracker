// ─── Types (unchanged) ───────────────────────────────────────────────────────

import { useState, useRef, useMemo } from "react";
import { Team } from "../../shared/TeamSchema";

const ENABLE_CONNECTORS = true;

export type BracketMatch = {
    matchId: string;
    team1: Team | null;
    team2: Team | null;
    winner?: Team | null;
    loser?: Team | null;
    winnerNextMatchId?: string | null;
    loserNextMatchId?: string | null;
    label?: string;
    mapCount?: number,
    playedAt?: Date
};

export function convertToTournamentMatchesTable(match: BracketMatch, tournamentId: number) {
    return ({
        Id: -1,
        MatchId: match.matchId,
        TournamentId: tournamentId,
        Team1Id: match.team1?.Id ?? null,
        Team2Id: match.team2?.Id ?? null,
        WinnerId: match.winner?.Id ?? null,
        WinnerNextMatchId: match.winnerNextMatchId ?? null,
        LoserNextMatchId: match.loserNextMatchId ?? null,
        Label: match.label!,
        MapCount: match.mapCount!,
        PlayedAt: match.playedAt ?? new Date()
    })
}

type BracketSection = "winners" | "losers" | "grand-final";

type LayoutMatch = BracketMatch & {
    col: number;
    row: number;
    section: BracketSection;
    x: number;
    y: number;
};

type SlotRef = { matchId: string; slot: "team1" | "team2" };

// ─── Layout constants ─────────────────────────────────────────────────────────

const CARD_W = 190;
const CARD_H = 72;
const COL_GAP = 64;
const ROW_GAP = 16;
const SECTION_GAP = 48;

// ─── Downstream clearing ──────────────────────────────────────────────────────

/**
 * Collect all match IDs downstream of a given slot.
 * Used to warn + clear when a team is moved out of a slot that has results.
 */
function getDownstreamIds(matchId: string, matches: BracketMatch[]): string[] {
    const byId = new Map(matches.map((m) => [m.matchId, m]));
    const visited = new Set<string>();
    const queue = [matchId];
    while (queue.length) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const m = byId.get(id);
        if (!m) continue;
        if (m.winnerNextMatchId) queue.push(m.winnerNextMatchId);
        if (m.loserNextMatchId) queue.push(m.loserNextMatchId);
    }
    visited.delete(matchId); // don't clear the match itself
    return [...visited];
}

function hasDownstreamResults(ids: string[], matches: BracketMatch[]) {
    const byId = new Map(matches.map((m) => [m.matchId, m]));
    return ids.some((id) => {
        const m = byId.get(id);
        return m && (m.team1 || m.team2 || m.winner);
    });
}

function clearDownstream(ids: string[], matches: BracketMatch[]): BracketMatch[] {
    return matches.map((m) => (ids.includes(m.matchId) ? { ...m, team1: null, team2: null, winner: null, loser: null } : m));
}

// ─── Layout (same as before) ──────────────────────────────────────────────────

function buildAdjacency(matches: BracketMatch[]) {
    const byId = new Map(matches.map((m) => [m.matchId, m]));
    const losersIds = new Set<string>();
    for (const m of matches) {
        if (m.loserNextMatchId) losersIds.add(m.loserNextMatchId);
    }
    return { byId, losersIds };
}

function assignColumns(matches: BracketMatch[], byId: Map<string, BracketMatch>): Map<string, number> {
    const incomingWinner = new Set<string>();
    for (const m of matches) {
        if (m.winnerNextMatchId) incomingWinner.add(m.winnerNextMatchId);
        if (m.loserNextMatchId) incomingWinner.add(m.loserNextMatchId);
    }
    const cols = new Map<string, number>();
    const queue: string[] = [];
    for (const m of matches) {
        if (!incomingWinner.has(m.matchId)) {
            queue.push(m.matchId);
            cols.set(m.matchId, 0);
        }
    }
    while (queue.length) {
        const n = queue.length;
        for (let i = 0; i < n; ++i) {
            const id = queue.shift()!;
            const m = byId.get(id)!;
            const col = cols.get(id)!;
            if (m.winnerNextMatchId != null) {
                cols.set(m.winnerNextMatchId, col + 1);
                queue.push(m.winnerNextMatchId);
            }
            if (m.loserNextMatchId != null) {
                const prev = cols.get(m.loserNextMatchId) ?? col + 1;
                cols.set(m.loserNextMatchId, prev);
                queue.push(m.loserNextMatchId);
            }
        }
    }
    return cols;
}

function classifySection(
    matches: BracketMatch[],
    losersIds: Set<string>,
    cols: Map<string, number>,
): Map<string, BracketSection> {
    const maxCol = Math.max(...[...cols.values()]);
    const sections = new Map<string, BracketSection>();

    // First pass: mark grand final and known losers bracket matches
    for (const m of matches) {
        const col = cols.get(m.matchId) ?? 0;
        if (col === maxCol) {
            sections.set(m.matchId, "grand-final");
        } else if (losersIds.has(m.matchId)) {
            sections.set(m.matchId, "losers");
        }
    }

    // Second pass: propagate losers classification forward through winnerNextMatchId chains.
    // A match whose winnerNextMatchId points to a losers match is itself a losers match.
    let changed = true;
    while (changed) {
        changed = false;
        for (const m of matches) {
            if (sections.get(m.matchId) === "losers") continue;
            if (sections.get(m.matchId) === "grand-final") continue;
            const nextId = m.winnerNextMatchId;
            if (nextId && sections.get(nextId) === "losers") {
                sections.set(m.matchId, "losers");
                changed = true;
            }
        }
    }

    // Third pass: anything still unclassified is winners bracket
    for (const m of matches) {
        if (!sections.has(m.matchId)) {
            sections.set(m.matchId, "winners");
        }
    }

    return sections;
}

function layoutMatches(matches: BracketMatch[]): LayoutMatch[] {
    const { byId, losersIds } = buildAdjacency(matches);
    const cols = assignColumns(matches, byId);
    const sections = classifySection(matches, losersIds, cols);

    const grid: Record<BracketSection, Map<number, BracketMatch[]>> = {
        winners: new Map(),
        losers: new Map(),
        "grand-final": new Map(),
    };
    for (const m of matches) {
        const sec = sections.get(m.matchId)!;
        const col = cols.get(m.matchId) ?? 0;
        if (!grid[sec].has(col)) grid[sec].set(col, []);
        grid[sec].get(col)!.push(m);
    }

    const colW = CARD_W + COL_GAP;
    const layout: LayoutMatch[] = [];

    const placeSection = (sec: BracketSection, xBase: number, yBase: number) => {
        const secGrid = grid[sec];
        const sortedCols = [...secGrid.keys()].sort((a, b) => a - b);
        for (const col of sortedCols) {
            const ms = secGrid.get(col)!;
            ms.forEach((m, row) => {
                layout.push({
                    ...m,
                    col,
                    row,
                    section: sec,
                    x: xBase + col * colW,
                    y: yBase + row * (CARD_H + ROW_GAP),
                });
            });
        }
    };

    placeSection("winners", 0, 0);
    const winnersHeight = Math.max(...[...grid.winners.values()].map((ms) => ms.length), 1) * (CARD_H + ROW_GAP);
    const losersY = winnersHeight + SECTION_GAP;
    placeSection("losers", 0, losersY);
    const losersHeight = Math.max(...[...grid.losers.values()].map((ms) => ms.length), 1) * (CARD_H + ROW_GAP);

    const winnersMaxCol = Math.max(...([...grid.winners.keys()].length ? [...grid.winners.keys()] : [0]));
    const losersMaxCol = Math.max(...([...grid.losers.keys()].length ? [...grid.losers.keys()] : [0]));
    const gfCol = Math.max(winnersMaxCol, losersMaxCol) + 1;
    const totalH = losersY + losersHeight;
    const gfMs = [...grid["grand-final"].values()].flat();
    gfMs.forEach((m, i) => {
        layout.push({
            ...m,
            col: gfCol,
            row: i,
            section: "grand-final",
            x: gfCol * colW,
            y: totalH / 2 - (gfMs.length * (CARD_H + ROW_GAP)) / 2 + i * (CARD_H + ROW_GAP),
        });
    });

    return layout;
}

// ─── Warning modal ────────────────────────────────────────────────────────────

function DownstreamWarning({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Clear downstream results?</p>
                    <p className="text-xs text-gray-400">
                        Moving this team will clear match results in subsequent rounds that depend on this slot. This
                        cannot be undone.
                    </p>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                    >
                        Clear & move
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Team slot ────────────────────────────────────────────────────────────────

function TeamSlot({
    team,
    slot,
    matchId,
    isWinner,
    editMode,
    selected,
    isValidTarget,
    onDragStart,
    onDrop,
    onClick,
}: {
    team: Team | null;
    slot: "team1" | "team2";
    matchId: string;
    isWinner?: boolean;
    editMode: boolean;
    selected: boolean;
    isValidTarget: boolean;
    onDragStart: (ref: SlotRef) => void;
    onDrop: (ref: SlotRef) => void;
    onClick: (ref: SlotRef) => void;
}) {
    const ref: SlotRef = { matchId, slot };

    const [dragOver, setDragOver] = useState(false);

    const interactive = editMode;
    const highlight = selected
        ? "ring-2 ring-red-500"
        : dragOver && isValidTarget
          ? "ring-2 ring-blue-400"
          : isValidTarget && editMode
            ? "ring-1 ring-gray-500"
            : "";

    return (
        <div
            draggable={interactive && !!team}
            onDragStart={interactive && team ? () => onDragStart(ref) : undefined}
            onDragOver={
                interactive
                    ? (e) => {
                          e.preventDefault();
                          setDragOver(true);
                      }
                    : undefined
            }
            onDragLeave={interactive ? () => setDragOver(false) : undefined}
            onDrop={
                interactive
                    ? (e) => {
                          e.preventDefault();
                          setDragOver(false);
                          onDrop(ref);
                      }
                    : undefined
            }
            onClick={interactive ? () => onClick(ref) : undefined}
            className={`flex items-center gap-2 px-3 py-1.5 transition-all ${
                isWinner ? "bg-red-500/10" : ""
            } ${highlight} ${
                interactive && team ? "cursor-grab active:cursor-grabbing" : ""
            } ${interactive && isValidTarget ? "cursor-pointer" : ""} ${selected ? "bg-red-500/20" : ""}`}
        >
            {team ? (
                <>
                    {isWinner && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                    <span
                        className={`text-xs font-medium truncate flex-1 ${isWinner ? "text-white" : "text-gray-300"}`}
                    >
                        {team.Name}
                    </span>
                    {isWinner && <span className="ml-auto text-xs text-red-400">✓</span>}
                </>
            ) : (
                <span className="text-xs italic text-gray-600">TBD</span>
            )}
        </div>
    );
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({
    match,
    style,
    editMode,
    selectedSlot,
    dragSourceSlot,
    onDragStart,
    onDrop,
    onSlotClick,
}: {
    match: LayoutMatch;
    style?: React.CSSProperties;
    editMode: boolean;
    selectedSlot: SlotRef | null;
    dragSourceSlot: SlotRef | null;
    onDragStart: (ref: SlotRef) => void;
    onDrop: (ref: SlotRef) => void;
    onSlotClick: (ref: SlotRef) => void;
}) {
    const isGrandFinal = match.section === "grand-final";
    const isLosers = match.section === "losers";

    const isValidTarget = (slot: "team1" | "team2") => {
        if (!editMode) return false;
        const sourceRef = selectedSlot ?? dragSourceSlot;
        if (!sourceRef) return false;
        // Can't target itself
        if (sourceRef.matchId === match.matchId && sourceRef.slot === slot) return false;
        // Only allow swapping into a slot that already has a team
        if (!match[slot]) return false;
        return true;
    };

    return (
        <div
            style={{ width: CARD_W, ...style }}
            className={`absolute rounded-lg overflow-hidden border transition-all ${
                isGrandFinal ? "border-red-500/50" : isLosers ? "border-gray-600/50" : "border-gray-700/60"
            } bg-gray-900 ${editMode ? "shadow-lg shadow-black/30" : ""}`}
        >
            {(match.label || isGrandFinal) && (
                <div
                    className={`px-3 py-0.5 text-[10px] uppercase tracking-widest font-medium border-b ${
                        isGrandFinal
                            ? "text-red-400 border-red-500/30 bg-red-500/5"
                            : isLosers
                              ? "text-gray-500 border-gray-700"
                              : "text-gray-500 border-gray-800"
                    }`}
                >
                    {match.label ?? "Grand Final"}
                </div>
            )}
            <div className="divide-y divide-gray-800">
                {(["team1", "team2"] as const).map((slot) => (
                    <TeamSlot
                        key={slot}
                        team={match[slot]}
                        slot={slot}
                        matchId={match.matchId}
                        isWinner={!!(match.winner && match[slot] && match.winner.Id === match[slot]!.Id)}
                        editMode={editMode}
                        selected={!!(selectedSlot?.matchId === match.matchId && selectedSlot?.slot === slot)}
                        isValidTarget={isValidTarget(slot)}
                        onDragStart={onDragStart}
                        onDrop={onDrop}
                        onClick={onSlotClick}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Connectors ───────────────────────────────────────────────────────────────

function Connectors({ layout, totalW, totalH }: { layout: LayoutMatch[]; totalW: number; totalH: number }) {
    const byId = new Map(layout.map((m) => [m.matchId, m]));
    const lines: React.ReactNode[] = [];
    if (!ENABLE_CONNECTORS) return;
    for (const m of layout) {
        const srcX = m.x + CARD_W;
        const srcY = m.y + CARD_H / 2;

        if (m.winnerNextMatchId) {
            const target = byId.get(m.winnerNextMatchId);
            if (target) {
                const tgtX = target.x;
                const tgtY = target.y + CARD_H / 2;
                const mx = (srcX + tgtX) / 2;
                lines.push(
                    <path
                        key={`w-${m.matchId}`}
                        d={`M${srcX},${srcY} C${mx},${srcY} ${mx},${tgtY} ${tgtX},${tgtY}`}
                        fill="none"
                        stroke={m.section === "grand-final" ? "#ef4444" : "#4b5563"}
                        strokeWidth={m.section === "grand-final" ? 1.5 : 1}
                        opacity={0.6}
                    />,
                );
            }
        }
        if (m.loserNextMatchId) {
            const target = byId.get(m.loserNextMatchId);
            if (target) {
                const tgtX = target.x;
                const tgtY = target.y + CARD_H / 2;
                const mx = (srcX + tgtX) / 2;
                lines.push(
                    <path
                        key={`l-${m.matchId}`}
                        d={`M${srcX},${srcY} C${mx},${srcY} ${mx},${tgtY} ${tgtX},${tgtY}`}
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth={1}
                        strokeDasharray="4 3"
                        opacity={0.4}
                    />,
                );
            }
        }
    }

    return (
        <svg
            style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
            width={totalW}
            height={totalH}
        >
            {lines}
        </svg>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BracketView({
    matches: initialMatches,
    onChange,
}: {
    matches: BracketMatch[];
    onChange?: (matches: BracketMatch[]) => void;
}) {
    const [matches, setMatches] = useState<BracketMatch[]>(initialMatches);
    const [editMode, setEditMode] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<SlotRef | null>(null);
    const dragSourceSlot = useRef<SlotRef | null>(null);

    // Pending swap waiting for user confirmation
    const [pendingSwap, setPendingSwap] = useState<{
        from: SlotRef;
        to: SlotRef;
        downstreamIds: string[];
    } | null>(null);

    const layout = useMemo(() => layoutMatches(matches), [matches]);

    const totalW = Math.max(...layout.map((m) => m.x + CARD_W)) + COL_GAP;
    const totalH = Math.max(...layout.map((m) => m.y + CARD_H)) + 40;

    const updateMatches = (next: BracketMatch[]) => {
        setMatches(next);
        onChange?.(next);
    };

    // Perform the actual swap between two slots
    const doSwap = (from: SlotRef, to: SlotRef, clearedMatches: BracketMatch[]) => {
        const fromMatch = clearedMatches.find((m) => m.matchId === from.matchId)!;
        const toMatch = clearedMatches.find((m) => m.matchId === to.matchId)!;
        const fromTeam = fromMatch[from.slot];
        const toTeam = toMatch[to.slot];

        const next = clearedMatches.map((m) => {
            if (m.matchId === from.matchId && m.matchId === to.matchId) {
                // Both slots are in the same match — apply both changes at once
                return { ...m, [from.slot]: toTeam, [to.slot]: fromTeam };
            }
            if (m.matchId === from.matchId) return { ...m, [from.slot]: toTeam };
            if (m.matchId === to.matchId) return { ...m, [to.slot]: fromTeam };
            return m;
        });

        updateMatches(next);
        setSelectedSlot(null);
        dragSourceSlot.current = null;
    };

    // Entry point for any move attempt — checks for downstream results
    const attemptSwap = (from: SlotRef, to: SlotRef) => {
        if (from.matchId === to.matchId && from.slot === to.slot) return;

        const fromDownstream = getDownstreamIds(from.matchId, matches);
        const toDownstream = getDownstreamIds(to.matchId, matches);
        const allDownstream = [...new Set([...fromDownstream, ...toDownstream])];

        // if (hasDownstreamResults(allDownstream, matches)) {
        //     setPendingSwap({ from, to, downstreamIds: allDownstream });
        // } else {
        doSwap(from, to, matches);
        // }
    };

    // Drag handlers
    const handleDragStart = (ref: SlotRef) => {
        dragSourceSlot.current = ref;
        setSelectedSlot(null);
    };

    const handleDrop = (ref: SlotRef) => {
        if (!dragSourceSlot.current) return;
        const target = matches.find((m) => m.matchId === ref.matchId);
        if (!target?.[ref.slot]) {
            dragSourceSlot.current = null;
            return;
        }
        attemptSwap(dragSourceSlot.current, ref);
        dragSourceSlot.current = null;
    };

    // Click-to-select handlers
    const handleSlotClick = (ref: SlotRef) => {
        const clickedMatch = matches.find((m) => m.matchId === ref.matchId);
        const clickedTeam = clickedMatch?.[ref.slot];

        if (!selectedSlot) {
            // Only select if the slot has a team
            if (!clickedTeam) return;
            setSelectedSlot(ref);
        } else if (selectedSlot.matchId === ref.matchId && selectedSlot.slot === ref.slot) {
            // Clicking same slot deselects
            setSelectedSlot(null);
        } else {
            // Only swap if destination also has a team
            if (!clickedTeam) {
                setSelectedSlot(null);
                return;
            }
            attemptSwap(selectedSlot, ref);
        }
    };

    const hasLosers = layout.some((m) => m.section === "losers");
    const winnersY = Math.min(...layout.filter((m) => m.section === "winners").map((m) => m.y));
    const losersY = hasLosers ? Math.min(...layout.filter((m) => m.section === "losers").map((m) => m.y)) : null;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => {
                        setEditMode((e) => !e);
                        setSelectedSlot(null);
                        dragSourceSlot.current = null;
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        editMode
                            ? "bg-red-500/10 border-red-500/50 text-red-400"
                            : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                    }`}
                >
                    <span>{editMode ? "✎" : "✎"}</span>
                    {editMode ? "Exit edit mode" : "Edit bracket"}
                </button>

                {editMode && (
                    <p className="text-xs text-gray-500">
                        {selectedSlot
                            ? "Now click a second slot to swap"
                            : "Click a team slot to select it, or drag and drop"}
                    </p>
                )}
            </div>

            {/* Bracket canvas */}
            <div className="overflow-auto">
                <div style={{ width: totalW, height: totalH, position: "relative" }}>
                    <Connectors layout={layout} totalW={totalW} totalH={totalH} />

                    {/* Section labels */}
                    <div
                        style={{ position: "absolute", top: winnersY - 20, left: 0 }}
                        className="text-[10px] uppercase tracking-widest text-gray-600 font-medium"
                    >
                        Winners bracket
                    </div>
                    {losersY !== null && (
                        <div
                            style={{ position: "absolute", top: losersY - 20, left: 0 }}
                            className="text-[10px] uppercase tracking-widest text-gray-600 font-medium"
                        >
                            Losers bracket
                        </div>
                    )}

                    {layout.map((m) => (
                        <MatchCard
                            key={m.matchId}
                            match={m}
                            style={{ position: "absolute", top: m.y, left: m.x }}
                            editMode={editMode}
                            selectedSlot={selectedSlot}
                            dragSourceSlot={dragSourceSlot.current}
                            onDragStart={handleDragStart}
                            onDrop={handleDrop}
                            onSlotClick={handleSlotClick}
                        />
                    ))}
                </div>
            </div>

            {/* Warning modal */}
            {pendingSwap && (
                <DownstreamWarning
                    onConfirm={() => {
                        const cleared = clearDownstream(pendingSwap.downstreamIds, matches);
                        doSwap(pendingSwap.from, pendingSwap.to, cleared);
                        setPendingSwap(null);
                    }}
                    onCancel={() => {
                        setPendingSwap(null);
                        setSelectedSlot(null);
                        dragSourceSlot.current = null;
                    }}
                />
            )}
        </div>
    );
}
