import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HomeButton from "./components/ui/HomeButton";
import { BracketMatch, BracketView } from "./BracketView";
import { EntireTournament } from "../../shared/TournamentSchema";
import { Team } from "../../shared/TeamSchema";
import { TournamentTypes } from "./Constants";
import { useTeamsByTournamentId, useTournamentById } from "./ApiCallers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditTournamentSavePayload = {
    fields: {
        name: string;
        location: string;
        startDate: Date | null;
        endDate: Date | null;
    };
    placements: PlacementRow[];
    matches: BracketMatch[];
};

type PlacementRow = {
    teamId: number;
    teamName: string;
    seed: number | null;
    placement: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isElimTournament = (format: string) =>
    format === TournamentTypes.DoubleElim || format === TournamentTypes.SingleElim;

const FORMAT_LABELS: Partial<Record<TournamentTypes, string>> = {
    StageWithinGroup: "Regional Stage Within Your Group",
    StageOutOfGroup: "Regional Stage Outside Your Group",
    SwissIntoDoubleElim: "Swiss Into Double Elim",
    DoubleElim: "Double Elimination",
    SingleElim: "Single Elimination",
};

function dateToInputValue(d: Date | null): string {
    if (!d) return "";
    return d.toISOString().split("T")[0];
}

function inputValueToDate(s: string): Date | null {
    return s ? new Date(s) : null;
}

// ─── Section components ───────────────────────────────────────────────────────

const inputClass =
    "w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors text-sm";

const readonlyClass =
    "w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed select-none";

// ── Details ───────────────────────────────────────────────────────────────────

function SectionDetails({
    name,
    setName,
    location,
    setLocation,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    format,
}: {
    name: string;
    setName: (v: string) => void;
    location: string;
    setLocation: (v: string) => void;
    startDate: Date | null;
    setStartDate: (v: Date | null) => void;
    endDate: Date | null;
    setEndDate: (v: Date | null) => void;
    format: string;
}) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Tournament Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tournament name"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Format</label>
                <div className={readonlyClass}>{FORMAT_LABELS[format as TournamentTypes] ?? format}</div>
            </div>

            <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Location</label>
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, venue, or online"
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Start Date</label>
                    <input
                        type="date"
                        value={dateToInputValue(startDate)}
                        onChange={(e) => setStartDate(inputValueToDate(e.target.value))}
                        className={`${inputClass} [color-scheme:dark]`}
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">End Date</label>
                    <input
                        type="date"
                        value={dateToInputValue(endDate)}
                        onChange={(e) => setEndDate(inputValueToDate(e.target.value))}
                        min={dateToInputValue(startDate)}
                        className={`${inputClass} [color-scheme:dark]`}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Seeding ───────────────────────────────────────────────────────────────────

function SectionSeeding({
    placements,
    onChange,
}: {
    placements: PlacementRow[];
    onChange: (p: PlacementRow[]) => void;
}) {
    console.log(placements);
    const dragTeam = useRef<{ teamId: number; fromSlot: number | null } | null>(null);

    const maxSeeds = placements.filter((p) => p.seed !== null).length;

    const slots: (PlacementRow | null)[] = Array.from(
        { length: maxSeeds },
        (_, i) => placements.find((p) => p.seed === i + 1) ?? null,
    );

    const unseeded = placements.filter((p) => p.seed === null);

    const handleDropOnSlot = (slotIndex: number) => {
        if (!dragTeam.current) return;

        const { teamId, fromSlot } = dragTeam.current;
        const newSeed = slotIndex + 1;

        if (newSeed > maxSeeds) return;

        const updated = placements.map((p) => {
            if (p.teamId === teamId) {
                return { ...p, seed: newSeed };
            }

            // swap with whoever is in the slot
            if (p.seed === newSeed) {
                return {
                    ...p,
                    seed: fromSlot !== null ? fromSlot + 1 : null,
                };
            }

            return p;
        });

        onChange(updated);
        dragTeam.current = null;
    };

    const handleDropOnPool = () => {
        if (!dragTeam.current) return;

        const { teamId } = dragTeam.current;

        const updated = placements.map((p) => (p.teamId === teamId ? { ...p, seed: null } : p));

        onChange(updated);
        dragTeam.current = null;
    };

    const handleAutoSeed = () => {
        const sorted = [...placements].sort((a, b) => a.teamName.localeCompare(b.teamName));
        onChange(sorted.map((p, i) => ({ ...p, seed: i + 1 })));
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-400">
                Drag teams from the pool into seed slots. Seed 1 is the top seed. Teams in higher seeds get easier early
                matchups.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seed slots */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs uppercase tracking-widest text-gray-400">Bracket Seeds</div>
                        <button
                            onClick={handleAutoSeed}
                            className="text-xs px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all font-medium"
                        >
                            Auto-Seed
                        </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {slots.map((row, i) => (
                            <div
                                key={i}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDropOnSlot(i)}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border-2 border-dashed transition-all ${
                                    row
                                        ? "border-red-500/50 bg-red-500/10"
                                        : "border-gray-700 bg-gray-900/50 hover:border-gray-500"
                                }`}
                            >
                                <span className="text-xs font-bold text-gray-500 w-6 text-center">#{i + 1}</span>
                                {row ? (
                                    <div
                                        draggable
                                        onDragStart={() => (dragTeam.current = { teamId: row.teamId, fromSlot: i })}
                                        className="flex-1 flex items-center gap-2 cursor-grab active:cursor-grabbing"
                                    >
                                        <span className="text-sm font-medium text-white">{row.teamName}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-600 italic">Drop a team here</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Unseeded pool */}
                <div>
                    <div className="text-xs uppercase tracking-widest text-gray-400 mb-3">
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
                            unseeded.map((row) => (
                                <div
                                    key={row.teamId}
                                    draggable
                                    onDragStart={() => (dragTeam.current = { teamId: row.teamId, fromSlot: null })}
                                    className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800 border border-gray-700 cursor-grab active:cursor-grabbing hover:border-gray-500 transition-colors"
                                >
                                    <span className="text-sm font-medium text-gray-200">{row.teamName}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Placements ────────────────────────────────────────────────────────────────

function SectionPlacements({
    placements,
    onChange,
}: {
    placements: PlacementRow[];
    onChange: (p: PlacementRow[]) => void;
}) {
    const sorted = [...placements].sort((a, b) => {
        if (a.placement === null && b.placement === null) return a.teamName.localeCompare(b.teamName);
        if (a.placement === null) return 1;
        if (b.placement === null) return -1;
        return a.placement - b.placement;
    });

    const setPlacement = (teamId: number, value: string) => {
        const num = value === "" ? null : parseInt(value, 10);
        if (num !== null && (isNaN(num) || num < 1)) return;
        onChange(placements.map((p) => (p.teamId === teamId ? { ...p, placement: num } : p)));
    };

    const maxPlacement = placements.length;

    const placementCounts = sorted.reduce(
        (acc, row) => {
            if (row.placement !== null && row.placement !== undefined) {
                acc[row.placement] = (acc[row.placement] || 0) + 1;
            }
            return acc;
        },
        {} as Record<number, number>,
    );

    const isDuplicatePlacement = (placement: number | null | undefined) =>
        placement != null && placementCounts[placement] > 1;

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">
                Set final placements for each team. Leave blank if the tournament is still in progress.
            </p>
            <div className="rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-800 bg-gray-900/60">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                Team
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest w-40">
                                Placement
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                        {sorted.map((row) => (
                            <tr key={row.teamId} className="hover:bg-gray-900/40 transition-colors">
                                <td className="px-4 py-3 text-gray-200 font-medium">{row.teamName}</td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        min={1}
                                        value={row.placement ?? ""}
                                        max={maxPlacement}
                                        onChange={(e) => setPlacement(row.teamId, e.target.value)}
                                        placeholder="—"
                                        className={`w-24 bg-gray-900 border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                            isDuplicatePlacement(row.placement)
                                                ? "border-red-500 bg-red-500/10 focus:border-red-500"
                                                : "border-gray-700 focus:border-red-500"
                                        }`}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Bracket ───────────────────────────────────────────────────────────────────

function SectionBracket({ matches, setMatches }: { matches: BracketMatch[]; setMatches: (m: BracketMatch[]) => void }) {
    console.log(matches)
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">View and edit team placements in the bracket.</p>
            <BracketView matches={matches} onChange={setMatches} />
        </div>
    );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

type EditSection = "details" | "seeding" | "placements" | "bracket";

const ALL_SECTIONS: { key: EditSection; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "seeding", label: "Seeding" },
    { key: "placements", label: "Placements" },
    { key: "bracket", label: "Bracket" },
];

function SectionIndicator({
    sections,
    current,
    onSelect,
}: {
    sections: { key: EditSection; label: string }[];
    current: EditSection;
    onSelect: (s: EditSection) => void;
}) {
    return (
        <div className="flex items-center justify-center gap-0 mb-10">
            {sections.map(({ key, label }, i) => {
                const active = key === current;
                const done = sections.findIndex((s) => s.key === current) > i;
                return (
                    <div key={key} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => onSelect(key)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                                    done
                                        ? "bg-red-500 border-red-500 text-white"
                                        : active
                                          ? "bg-transparent border-red-500 text-red-400"
                                          : "bg-transparent border-gray-600 text-gray-500"
                                }`}
                            >
                                {done ? "✓" : i + 1}
                            </button>
                            <span
                                className={`text-xs mt-1 font-medium ${
                                    active ? "text-red-400" : done ? "text-gray-300" : "text-gray-600"
                                }`}
                            >
                                {label}
                            </span>
                        </div>
                        {i < sections.length - 1 && (
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EditTournamentPage() {
    const navigate = useNavigate();

    const { id } = useParams<{ id: string }>();
    if (isNaN(Number(id))) throw new Error("Did not pass an acceptable tournament id");

    const tournamentId = Number(id);
    const [tournament, setTournament] = useTournamentById(tournamentId);

    console.log(tournament);
    const teams = useTeamsByTournamentId(tournamentId);

    const getTeam = (teamId: number) => {
        return teams.find((team) => team.Id == teamId) ?? null;
    };

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [placements, setPlacements] = useState<PlacementRow[]>([]);
    const [matches, setMatches] = useState<BracketMatch[]>([]);

    useEffect(() => {
        if (!tournament) return;
        setName(tournament.Name);
        setLocation(tournament.Location);
        setStartDate(tournament.StartDate);
        setEndDate(tournament.EndDate);
        setPlacements(
            tournament.Placements.map((p) => ({
                teamId: p.TeamId,
                teamName: getTeam(p.TeamId)?.Name ?? "",
                seed: p.Seed,
                placement: p.Placement,
            })),
        );
        setMatches(tournamentMatchesToBracketMatches(tournament.Matches));
    }, [tournament, teams]);

    function tournamentMatchesToBracketMatches(dbMatches: typeof tournament.Matches): BracketMatch[] {
        return dbMatches.map((m) => ({
            matchId: m.MatchId,
            team1: m.Team1Id ? getTeam(m.Team1Id) : null,
            team2: m.Team2Id ? getTeam(m.Team2Id) : null,
            winner: m.WinnerId ? getTeam(m.WinnerId) : null,
            winnerNextMatchId: m.WinnerNextMatchId,
            loserNextMatchId: m.LoserNextMatchId,
            label: m.Label,
            mapCount: m.MapCount,
            playedAt: m.PlayedAt ?? undefined,
        }));
    }

    const [saving, setSaving] = useState(false);

    const showBracket = isElimTournament(tournament.Format as TournamentTypes);

    const visibleSections = ALL_SECTIONS.filter((s) => s.key !== "bracket" || showBracket);

    const [activeSection, setActiveSection] = useState<EditSection>(visibleSections[0].key);

    const currentIndex = visibleSections.findIndex((s) => s.key === activeSection);

    const handleNext = () => {
        if (currentIndex < visibleSections.length - 1) {
            setActiveSection(visibleSections[currentIndex + 1].key);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setActiveSection(visibleSections[currentIndex - 1].key);
        }
    };

    const onSave = (obj: object) => {};

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                fields: { name, location, startDate, endDate },
                placements,
                matches,
            });
        } finally {
            setSaving(false);
        }
    };

    const isLast = currentIndex === visibleSections.length - 1;

    return (
        <div className="min-h-screen w-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">Edit Tournament</h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {tournament.Name} ·{" "}
                            {FORMAT_LABELS[tournament.Format as TournamentTypes] ?? tournament.Format}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <SectionIndicator sections={visibleSections} current={activeSection} onSelect={setActiveSection} />

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 min-h-64">
                    {activeSection === "details" && (
                        <SectionDetails
                            name={tournament.Name}
                            setName={setName}
                            location={location}
                            setLocation={setLocation}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            format={tournament.Format}
                        />
                    )}
                    {activeSection === "seeding" && <SectionSeeding placements={placements} onChange={setPlacements} />}
                    {activeSection === "placements" && (
                        <SectionPlacements placements={placements} onChange={setPlacements} />
                    )}
                    {activeSection === "bracket" && <SectionBracket matches={matches} setMatches={setMatches} />}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handleBack}
                        disabled={currentIndex === 0}
                        className="px-5 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                        ← Back
                    </button>

                    <div className="text-xs text-gray-600">
                        Section {currentIndex + 1} of {visibleSections.length}
                    </div>

                    {isLast ? (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-all"
                        >
                            {saving ? "Saving…" : "Save Tournament"}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2.5 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all"
                        >
                            Next →
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
