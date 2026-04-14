import { useState, useRef } from "react";
import { useNotes, useTagsByCategory } from "./ApiCallers";
import { Note, Tag } from "../../shared/NotesSchema";
import HomeButton from "./components/ui/HomeButton";
import { saveNotes, saveTags } from "./ApiPosters";
// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────

export type NoteType = "Question" | "Observation" | "Tip" | "Mistake";

export type TagCategory = {
    Category: string;
    Tags: string[];
};

// ─────────────────────────────────────────────
//  CONFIGURATION — edit freely
// ─────────────────────────────────────────────

const NOTE_TYPES: NoteType[] = ["Question", "Observation", "Tip", "Mistake"];

const TAG_TREE: TagCategory[] = [
  { Category: "Clutch",        Tags: ["1v1", "1v2", "1v3", "1v4", "1v5", "2v1", "2v2", "2v3", "2v4", "2v5", "3v1", "3v2", "3v3", "3v4", "3v5", "4v1", "4v2", "4v3", "4v4", "4v5", "5v1", "5v2", "5v3", "5v4", "5v5"] },
  { Category: "Economy",       Tags: ["Gun Round", "Anti-Eco", "Eco", "Bonus", "Full Save"] },
  { Category: "Side",       Tags: ["Attackers", "Defenders"] },
  { Category: "Map Area", Tags: ["A Site", "B Site", "Mid", "A Main", "B Main"] }
];
// all agents, all maps

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function buildCatOpenState(tags: TagCategory[], open: boolean): Record<string, boolean> {
    return Object.fromEntries(tags.map((c) => [c.Category, open]));
}

const TYPE_STYLES: Record<string, string> = {
    Question: "bg-red-500/10 border border-red-500/30 text-red-400",
    Observation: "bg-gray-700/40 border border-gray-700/60 text-gray-400",
    Tip: "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300",
    Mistake: "bg-amber-500/10 border border-amber-500/25 text-amber-300",
};

// ─────────────────────────────────────────────
//  SUB-COMPONENT PROPS
// ─────────────────────────────────────────────

interface TagChipProps {
    label: string;
    selected: boolean;
    onClick: () => void;
}

interface CategoryBlockProps {
    cat: string;
    tags: string[];
    selectedTags: Set<string>;
    onToggle: (tag: string) => void;
    openState: Record<string, boolean>;
    onToggleCat: (cat: string) => void;
}

interface NoteCardProps {
    note: Note;
    onEdit: (note: Note) => void;
    onDelete: (id: number) => void;
}

interface NoteModalProps {
    initial: Note | null;
    onSave: (note: Note) => void;
    onClose: () => void;
    nextPlaceHolderId: React.RefObject<number>;
    tagsByCategory: TagCategory[];
}

interface NewTagDialogProps {
    tagsByCategory: TagCategory[];
    onTagCreated: (tag: Tag) => void;
    onClose: () => void;
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────

function TagChip({ label, selected, onClick }: TagChipProps) {
    return (
        <button
            onClick={onClick}
            className={`px-2 py-0.5 text-[10px] rounded border transition-all cursor-pointer whitespace-nowrap
        ${
            selected
                ? "bg-red-500/10 border-red-500/50 text-red-400"
                : "bg-transparent border-gray-700/70 text-gray-500 hover:border-gray-500 hover:text-gray-300"
        }`}
        >
            {label}
        </button>
    );
}

function CategoryBlock({ cat, tags, selectedTags, onToggle, openState, onToggleCat }: CategoryBlockProps) {
    const isOpen = openState[cat] ?? true;

    return (
        <div className="rounded-lg bg-gray-800/60 border border-gray-700/60 overflow-hidden">
            <button
                onClick={() => onToggleCat(cat)}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-800/80 border-b border-gray-800 text-left"
            >
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">{cat}</span>
                <span
                    className={`text-gray-600 text-[9px] transition-transform duration-150 ${
                        isOpen ? "rotate-90" : ""
                    }`}
                >
                    ▶
                </span>
            </button>
            {isOpen && (
                <div className="flex flex-wrap gap-1.5 p-2">
                    {tags.map((t) => (
                        <TagChip key={t} label={t} selected={selectedTags.has(t)} onClick={() => onToggle(t)} />
                    ))}
                </div>
            )}
        </div>
    );
}

function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
    const badgeStyle = TYPE_STYLES[note.Category];

    return (
        <div className="rounded-lg bg-gray-900 border border-gray-700/60 overflow-hidden hover:border-gray-600/60 transition-colors group">
            <div className="flex items-start justify-between gap-2 px-3 pt-2.5">
                <span
                    className={`text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded ${badgeStyle}`}
                >
                    {note.Category}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(note)}
                        className="px-2 py-1 text-[10px] rounded border border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-200 transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(note.Id)}
                        className="px-2 py-1 text-[10px] rounded border border-gray-700 text-gray-500 hover:border-red-500/50 hover:text-red-400 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div className="px-3 pt-1.5 pb-1 text-sm font-medium text-gray-100 leading-snug">{note.Header}</div>

            {note.Body && (
                <div className="px-3 pb-2.5 text-xs text-gray-400 leading-relaxed border-b border-gray-800">
                    {note.Body}
                </div>
            )}

            {(note.Tags.length > 0 || note.Keywords.length > 0) && (
                <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
                    {note.Tags.map((t) => (
                        <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-400/80"
                        >
                            {t}
                        </span>
                    ))}
                    {note.Keywords.map((k) => (
                        <span
                            key={k}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700/60 text-gray-500"
                        >
                            {k}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
//  NOTE MODAL
// ─────────────────────────────────────────────

function NoteModal({ initial, onSave, onClose, nextPlaceHolderId, tagsByCategory }: NoteModalProps) {
    const [type, setType] = useState<string>(initial?.Category ?? "Question");
    const [header, setHeader] = useState<string>(initial?.Header ?? "");
    const [body, setBody] = useState<string>(initial?.Body ?? "");
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(initial?.Tags ?? []));
    const [keywords, setKeywords] = useState<string[]>(initial?.Keywords ?? []);
    const [kwInput, setKwInput] = useState<string>("");
    const [catOpen, setCatOpen] = useState<Record<string, boolean>>(() => buildCatOpenState(tagsByCategory, true));

    function toggleTag(tag: string): void {
        setSelectedTags((prev) => {
            const next = new Set(prev);
            next.has(tag) ? next.delete(tag) : next.add(tag);
            return next;
        });
    }

    function toggleCat(cat: string): void {
        setCatOpen((prev) => ({ ...prev, [cat]: !prev[cat] }));
    }

    function addKw(): void {
        const val = kwInput.trim();
        if (val && !keywords.includes(val)) {
            setKeywords((prev) => [...prev, val]);
        }
        setKwInput("");
    }

    function removeKw(index: number): void {
        setKeywords((prev) => prev.filter((_, i) => i !== index));
    }

    function handleKwKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
        if (e.key === "Enter") {
            e.preventDefault();
            addKw();
        }
    }

    async function handleSubmit(): Promise<void> {
        if (!header.trim()) return;
        const note: Note = {
            Id: initial?.Id ?? nextPlaceHolderId.current--,
            CreatedAt: initial?.CreatedAt ?? new Date(),
            Category: initial?.Category ?? "Question",
            Header: header.trim(),
            Body: body.trim(),
            Tags: [...selectedTags],
            Keywords: keywords,
        };
        await onSave(note);
    }

    function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>): void {
        if (e.target === e.currentTarget) onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
            onClick={handleOverlayClick}
        >
            <div className="w-full max-w-lg rounded-xl bg-gray-900 border border-gray-700/80 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                        {initial ? "Edit Note" : "New Note"}
                    </span>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors text-sm">
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-4">
                    {/* Type selector */}
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">Type</div>
                        <div className="flex flex-wrap gap-1.5">
                            {NOTE_TYPES.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`px-3 py-1 text-xs rounded border transition-all
                    ${
                        type === t
                            ? "bg-red-500/10 border-red-500/50 text-red-400"
                            : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title / Question */}
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                            Title / Question
                        </div>
                        <input
                            value={header}
                            onChange={(e) => setHeader(e.target.value)}
                            placeholder="e.g. How do I win a 1v2 on Bind?"
                            className="w-full bg-gray-800 border border-gray-700/80 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>

                    {/* Answer / Body */}
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                            Answer / Body
                        </div>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Your notes, observations, or answer..."
                            rows={4}
                            className="w-full bg-gray-800 border border-gray-700/80 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors resize-y"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">Tags</div>
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                            {tagsByCategory.map(({ Category, Tags }) => (
                                <CategoryBlock
                                    key={Category}
                                    cat={Category}
                                    tags={Tags}
                                    selectedTags={selectedTags}
                                    onToggle={toggleTag}
                                    openState={catOpen}
                                    onToggleCat={toggleCat}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Keywords */}
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                            Keywords
                        </div>
                        {keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {keywords.map((k, i) => (
                                    <span
                                        key={k}
                                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-gray-800 border border-gray-700/60 text-gray-400"
                                    >
                                        {k}
                                        <button
                                            onClick={() => removeKw(i)}
                                            className="text-gray-600 hover:text-red-400 transition-colors leading-none"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                value={kwInput}
                                onChange={(e) => setKwInput(e.target.value)}
                                onKeyDown={handleKwKeyDown}
                                placeholder="Type a keyword and press Enter..."
                                className="flex-1 bg-gray-800 border border-gray-700/80 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors"
                            />
                            <button
                                onClick={addKw}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!header.trim()}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {initial ? "Save Changes" : "Save Note"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function NewTagModal({ tagsByCategory, onTagCreated, onClose }: NewTagDialogProps) {
    const [category, setCategory] = useState<string>(tagsByCategory[0].Category);
    const [tagName, setTagName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const tagInputRef = useRef<HTMLInputElement>(null);

    function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>): void {
        if (e.target === e.currentTarget) onClose();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
        if (e.key === "Escape") onClose();
    }

    async function handleSubmit(): Promise<void> {
        setError(null);

        // Validate with zod before sending
        if (category == "" || tagName == "") {
            console.log(`Invalid tag with category ${category} and name ${tagName}`);
            setError("No category or tag name given");
            return;
        }

        // Check for duplicate within the selected category
        const existingCat = tagsByCategory.find((c) => c.Category === category);
        if (existingCat?.Tags.some((t) => t.toLowerCase() === tagName.toLowerCase())) {
            setError(`"${tagName}" already exists in ${category}`);
            return;
        }

        try {
            setSubmitting(true);
            onTagCreated({ Category: category, Name: tagName });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create tag. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>): Promise<void> {
        if (e.key === "Enter") {
            e.preventDefault();
            await handleSubmit();
        }
    }

    return (
        <>
            {/* ── DIALOG ───────────────────────────── */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
                onClick={handleOverlayClick}
                onKeyDown={handleKeyDown}
            >
                <div className="w-full max-w-sm rounded-xl bg-gray-900 border border-gray-700/80 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                            New Tag
                        </span>
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="text-gray-600 hover:text-gray-300 transition-colors text-sm disabled:opacity-40"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                        {/* Category picker */}
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                                Category
                            </div>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={submitting}
                                className="w-full bg-gray-800 border border-gray-700/80 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-red-500/50 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                                {tagsByCategory.map((c) => (
                                    <option key={c.Category} value={c.Category}>
                                        {c.Category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tag name */}
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                                Tag Name
                            </div>
                            <input
                                ref={tagInputRef}
                                value={tagName}
                                onChange={(e) => {
                                    setTagName(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={handleInputKeyDown}
                                disabled={submitting}
                                className="w-full bg-gray-800 border border-gray-700/80 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors disabled:opacity-40"
                            />
                        </div>

                        {/* Preview
                        {tagName.trim() && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">
                                    Preview
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                                    {tagName.trim()}
                                </span>
                                <span className="text-[10px] text-gray-600">in {category}</span>
                            </div>
                        )} */}

                        {/* Error */}
                        {error && (
                            <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-800">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !tagName.trim()}
                            className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Saving..." : "Create Tag"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────

export default function ValorantNotes() {
    const [notes, setNotes] = useNotes();
    const [newOrEditedNotes, setNewOrEditedNotes] = useState<Note[]>([]);
    const [newTags, setNewTags] = useState<Tag[]>([]);
    const [newNoteModalOpen, setNewNoteModalOpen] = useState<boolean>(false);
    const [newTagModalOpen, setNewTagModalOpen] = useState<boolean>(false);
    const [editNote, setEditNote] = useState<Note | null>(null);
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [kwFilter, setKwFilter] = useState<string>("");
    const [tagsByCategory, setTagsByCategory] = useTagsByCategory();
    const [catOpen, setCatOpen] = useState<Record<string, boolean>>(() => buildCatOpenState(tagsByCategory, true));

    const nextPlaceHolderId = useRef(-1);

    const saveAll = async () => {
        if(newTags.length > 0) {
            await saveTags(newTags);
        }
        if(newOrEditedNotes.length > 0) {
            await saveNotes(notes);
        }
    };


    function toggleSidebarTag(tag: string): void {
        setSelectedTags((prev) => {
            const next = new Set(prev);
            next.has(tag) ? next.delete(tag) : next.add(tag);
            return next;
        });
    }

    function toggleCat(cat: string): void {
        setCatOpen((prev) => ({ ...prev, [cat]: !prev[cat] }));
    }

    function clearFilters(): void {
        setSelectedTags(new Set());
        setKwFilter("");
    }

    function openNewNoteModal(): void {
        setEditNote(null);
        setNewNoteModalOpen(true);
    }

    function openEditOnNote(note: Note): void {
        setEditNote(note);
        setNewNoteModalOpen(true);
    }

    function closeNewNoteModal(): void {
        setNewNoteModalOpen(false);
        setEditNote(null);
    }

    function openNewTagModal(): void {
        setNewTagModalOpen(true);
    }

    function closeNewTagModal(): void {
        setNewTagModalOpen(false);
    }

    function handleSaveNote(note: Note) {
        console.log("Saving note", note, editNote);
        const updated = editNote ? notes.map((n) => (n.Id === note.Id ? note : n)) : [note, ...notes];
        setNotes(updated);
        setNewOrEditedNotes(editNote ? newOrEditedNotes.map((n) => (n.Id === note.Id ? note : n)) : [note, ...newOrEditedNotes]);
        closeNewNoteModal();
    }

    function handleSaveTag(tag: Tag): void {
        const updatedCategories = tagsByCategory.map((tc) =>
            tc.Category === tag.Category ? { ...tc, Tags: [...tc.Tags, tag.Name] } : tc,
        );
        setNewTags([...newTags, tag]);
        setTagsByCategory(updatedCategories);
    }

    function handleDelete(id: number) {
        setNotes(notes.filter((n) => n.Id !== id));
    }

    // Filtering
    const activeTags = [...selectedTags];
    const kw = kwFilter.trim().toLowerCase();

    const filtered: Note[] = notes.filter((n) => {
        if (activeTags.length && !activeTags.every((t) => n.Tags.includes(t))) return false;
        if (
            kw &&
            !n.Keywords.some((k) => k.toLowerCase().includes(kw)) &&
            !n.Header.toLowerCase().includes(kw) &&
            !n.Body.toLowerCase().includes(kw)
        )
            return false;
        return true;
    });

    return (
        <div className="flex flex-col w-screen min-h-screen bg-gray-900 text-white">
            {/* ── TOP BAR ─────────────────────────────── */}
            <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold tracking-wide">Valorant Notes</span>
                </div>
                <div className="flex justify-end items-center gap-2">
                    <HomeButton />
                    <button
                        onClick={saveAll}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                    >
                        Save
                    </button>
                    <button
                        onClick={openNewNoteModal}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                    >
                        + New Note
                    </button>
                    <button
                        onClick={openNewTagModal}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                    >
                        + New Tag
                    </button>
                </div>
            </header>

            <div className="flex flex-1">
                {/* ── SIDEBAR ─────────────────────────────── */}
                <aside className="w-56 flex-shrink-0 sticky top-[45px] self-start max-h-[calc(100vh-45px)] overflow-y-auto border-r border-gray-800 p-3 space-y-4">
                    {/* Keyword search */}
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                            Keyword Search
                        </div>
                        <input
                            value={kwFilter}
                            onChange={(e) => setKwFilter(e.target.value)}
                            placeholder="Filter by keyword..."
                            className="w-full bg-gray-800 border border-gray-700/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>

                    {/* Tag filters */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Tags</div>
                            {(selectedTags.size > 0 || kwFilter) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-[10px] text-gray-600 hover:text-gray-400 underline transition-colors"
                                >
                                    clear
                                </button>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            {tagsByCategory.map(({ Category, Tags }) => (
                                <CategoryBlock
                                    key={Category}
                                    cat={Category}
                                    tags={Tags}
                                    selectedTags={selectedTags}
                                    onToggle={toggleSidebarTag}
                                    openState={catOpen}
                                    onToggleCat={toggleCat}
                                />
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── MAIN ────────────────────────────────── */}
                <main className="flex-1 p-4 space-y-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">
                        <span className="text-gray-400">{filtered.length}</span> of {notes.length} notes
                    </div>

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 gap-2">
                            <div className="text-sm text-gray-600 font-medium">
                                {notes.length === 0 ? "No notes yet" : "No notes match your filters"}
                            </div>
                            <div className="text-xs text-gray-700 text-center">
                                {notes.length === 0
                                    ? 'Click "+ New Note" to get started.'
                                    : "Try adjusting your tag or keyword filters."}
                            </div>
                        </div>
                    )}

                    {filtered.map((note) => (
                        <NoteCard key={note.Id} note={note} onEdit={openEditOnNote} onDelete={handleDelete} />
                    ))}
                </main>
            </div>

            {/* ── MODAL ───────────────────────────────── */}
            {newNoteModalOpen && (
                <NoteModal
                    initial={editNote}
                    onSave={handleSaveNote}
                    onClose={closeNewNoteModal}
                    nextPlaceHolderId={nextPlaceHolderId}
                    tagsByCategory={tagsByCategory}
                />
            )}
            {/* ── MODAL ───────────────────────────────── */}
            {newTagModalOpen && (
                <NewTagModal tagsByCategory={tagsByCategory} onTagCreated={handleSaveTag} onClose={closeNewTagModal} />
            )}
        </div>
    );
}
