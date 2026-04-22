import { useState } from "react";
import { useAgents, useAllMaps, useRoles } from "./ApiCallers";
import { createAgent, updateMaps } from "./ApiPosters";
import { Agent, Map } from "../../shared/AssetSchema";

type CreationType = "map" | "agent";
type PageTab = "create" | "manageMaps";

async function createAgentInDatabase(name: string, role: string) {
    const agent: Agent = { Name: name, Role: role };
    await createAgent(agent);
}

async function createMapInDatabase(name: string, active: boolean) {
    const map: Map = { Name: name, Active: active };
    await updateMaps([map]);
}

function ItemList({ items, loading }: { items: string[]; loading: boolean }) {
    const [search, setSearch] = useState("");
    const filtered = items.filter((item) => item.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col h-full">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-gray-800 border border-gray-700/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors mb-2 flex-shrink-0"
            />
            <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
                {loading ? (
                    <div className="text-xs text-gray-600 py-4 text-center">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-xs text-gray-600 py-4 text-center">No results</div>
                ) : (
                    filtered.map((item) => (
                        <div
                            key={item}
                            className="px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-gray-800 transition-colors"
                        >
                            {item}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ManageMapsTab({ maps, loading, onSave }: {
    maps: Map[];
    loading: boolean;
    onSave: (changes: { Name: string; Active: boolean }[]) => Promise<void>;
}) {
    const [search, setSearch] = useState("");
    const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
    const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const filtered = maps.filter((m) => m.Name.toLowerCase().includes(search.toLowerCase()));
    const hasChanges = Object.keys(pendingChanges).length > 0;

    const getActive = (map: Map) =>
        map.Name in pendingChanges ? pendingChanges[map.Name] : map.Active;

    const handleToggle = (map: Map) => {
        setSaveStatus("idle");
        setPendingChanges((prev) => {
            const currentActive = getActive(map);
            // If toggling back to original value, remove from pending
            if (currentActive !== map.Active) {
                const next = { ...prev };
                delete next[map.Name];
                return next;
            }
            return { ...prev, [map.Name]: !currentActive };
        });
    };

    const handleSave = async () => {
        setSaveStatus("loading");
        try {
            const changes = Object.entries(pendingChanges).map(([Name, Active]) => ({ Name, Active }));
            await onSave(changes);
            setSaveStatus("success");
            setPendingChanges({});
        } catch {
            setSaveStatus("error");
        }
    };

    const handleDiscard = () => {
        setPendingChanges({});
        setSaveStatus("idle");
    };

    return (
        <main className="flex-1 flex items-start justify-center p-8">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1">
                            Manage
                        </div>
                        <h1 className="text-lg font-semibold text-white">Map Active Status</h1>
                    </div>

                    {/* Change counter badge */}
                    {hasChanges && (
                        <span className="text-[10px] text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 rounded-md px-2 py-1">
                            {Object.keys(pendingChanges).length} unsaved change{Object.keys(pendingChanges).length > 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search maps..."
                    className="w-full bg-gray-800 border border-gray-700/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors"
                />

                <div className="space-y-1">
                    {loading ? (
                        <div className="text-xs text-gray-600 py-8 text-center">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-xs text-gray-600 py-8 text-center">No maps found</div>
                    ) : (
                        filtered.map((map) => {
                            const active = getActive(map);
                            const isDirty = map.Name in pendingChanges;
                            return (
                                <div
                                    key={map.Name}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors
                                        ${isDirty
                                            ? "bg-yellow-400/5 border-yellow-400/20"
                                            : "bg-gray-800/50 border-gray-700/40 hover:border-gray-600/60"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-300 font-medium">{map.Name}</span>
                                        {isDirty && (
                                            <span className="text-[9px] text-yellow-400/70 uppercase tracking-wider">edited</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <span className={`text-[10px] font-medium ${active ? "text-green-400" : "text-gray-600"}`}>
                                            {active ? "Active" : "Inactive"}
                                        </span>
                                        <button
                                            onClick={() => handleToggle(map)}
                                            className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none
                                                ${active ? "bg-red-600" : "bg-gray-700"}`}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200
                                                    ${active ? "translate-x-4" : "translate-x-0"}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Save / Discard row */}
                {hasChanges && (
                    <div className="flex items-center gap-2 pt-1">
                        <button
                            onClick={handleSave}
                            disabled={saveStatus === "loading"}
                            className="px-4 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {saveStatus === "loading" ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            onClick={handleDiscard}
                            disabled={saveStatus === "loading"}
                            className="px-4 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-gray-400 hover:text-gray-200 transition-colors font-medium disabled:opacity-40"
                        >
                            Discard
                        </button>
                    </div>
                )}

                {saveStatus === "success" && (
                    <p className="text-xs text-green-400">Changes saved successfully.</p>
                )}
                {saveStatus === "error" && (
                    <p className="text-xs text-red-400">Something went wrong. Please try again.</p>
                )}
            </div>
        </main>
    );
}

export default function CreateMapOrAgentPage() {
    const [pageTab, setPageTab] = useState<PageTab>("create");
    const [type, setType] = useState<CreationType>("map");
    const [name, setName] = useState("");
    const [isActive, setActive] = useState(false);
    const [role, setRole] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const [agents, fetchAgents] = useAgents();
    const [maps, fetchMaps]  = useAllMaps();
    const roles = useRoles();

    const mapNames = maps.map((m) => m.Name);
    const isLoading = type === "agent" ? agents.length === 0 : maps.length === 0;

    const handleSubmit = async () => {
        if (!name.trim()) return;
        if (type === "agent" && !role) return;
        setStatus("loading");
        try {
            if (type === "map") {
                await createMapInDatabase(name, isActive);
                fetchMaps();
            } else {
                await createAgentInDatabase(name, role);
                fetchAgents();
            }
            setStatus("success");
            setName("");
            setActive(false);
            setRole("");
        } catch {
            setStatus("error");
        }
    };

    const handleTypeChange = (t: CreationType) => {
        setType(t);
        setStatus("idle");
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        setStatus("idle");
    };

    const handleMapSave = async (changes: { Name: string; Active: boolean }[]) => {
        await updateMaps(changes);
        fetchMaps();
    };

    const currentItems = type === "agent" ? agents : mapNames;

    return (
        <div className="flex flex-col w-screen min-h-screen bg-gray-900 text-white">
            {/* TOP BAR */}
            <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold tracking-wide">Valorant Notes</span>
                </div>

                {/* Page-level tabs */}
                <div className="flex rounded-lg overflow-hidden border border-gray-700/60">
                    {(["create", "manageMaps"] as PageTab[]).map((tab, i) => (
                        <button
                            key={tab}
                            onClick={() => setPageTab(tab)}
                            className={`px-4 py-1.5 text-xs font-medium transition-colors
                                ${i === 0 ? "border-r border-gray-700/60" : ""}
                                ${pageTab === tab
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                                }`}
                        >
                            {tab === "create" ? "Create" : "Manage Maps"}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex flex-1 min-h-0">
                {/* SIDEBAR — only shown on create tab */}
                {pageTab === "create" && (
                    <aside className="w-72 flex-shrink-0 sticky top-[45px] self-start max-h-[calc(100vh-45px)] flex flex-col p-3">
                        <div className="flex items-center justify-between mb-2 flex-shrink-0">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                                Existing {type === "map" ? "Maps" : "Agents"}
                            </div>
                            {!isLoading && (
                                <span className="text-[10px] text-gray-600">{currentItems.length}</span>
                            )}
                        </div>
                        <div className="flex-1 min-h-0">
                            <ItemList items={currentItems} loading={isLoading} />
                        </div>
                    </aside>
                )}

                {/* MAIN CONTENT */}
                {pageTab === "manageMaps" ? (
                    <ManageMapsTab
                        maps={maps}
                        loading={maps.length === 0}
                        onSave={handleMapSave}
                    />
                ) : (
                    <main className="flex-1 flex items-start justify-center p-8 border-r border-gray-800">
                        <div className="w-full max-w-md space-y-6">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1">
                                    Create new
                                </div>
                                <h1 className="text-lg font-semibold text-white">
                                    New {type === "map" ? "Map" : "Agent"}
                                </h1>
                            </div>

                            {/* Type toggle */}
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                                    Type
                                </div>
                                <div className="flex rounded-lg overflow-hidden border border-gray-700/60 w-fit">
                                    {(["map", "agent"] as CreationType[]).map((t, i) => (
                                        <button
                                            key={t}
                                            onClick={() => handleTypeChange(t)}
                                            className={`px-5 py-1.5 text-xs font-medium transition-colors capitalize
                                                ${i === 0 ? "border-r border-gray-700/60" : ""}
                                                ${type === t
                                                    ? "bg-red-600 text-white"
                                                    : "bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name input */}
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                                    Name
                                </div>
                                <input
                                    value={name}
                                    onChange={handleNameChange}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                    placeholder={`Enter ${type} name...`}
                                    className="w-full bg-gray-800 border border-gray-700/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors"
                                />
                            </div>

                            {/* Map: Active toggle */}
                            {type === "map" && (
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                                        Status
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setActive((v) => !v)}
                                            className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none
                                                ${isActive ? "bg-red-600" : "bg-gray-700"}`}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200
                                                    ${isActive ? "translate-x-4" : "translate-x-0"}`}
                                            />
                                        </button>
                                        <span className={`text-xs font-medium ${isActive ? "text-green-400" : "text-gray-500"}`}>
                                            {isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Agent: Role selector */}
                            {type === "agent" && (
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">
                                        Role
                                    </div>
                                    {roles.length === 0 ? (
                                        <div className="text-xs text-gray-600">Loading roles...</div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {roles.map((r) => (
                                                <button
                                                    key={r}
                                                    onClick={() => setRole(r)}
                                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize
                                                        ${role === r
                                                            ? "bg-red-600 text-white"
                                                            : "bg-gray-800 border border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-500"
                                                        }`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={!name.trim() || status === "loading" || (type === "agent" && !role)}
                                className="px-4 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {status === "loading" ? "Creating..." : `Create ${type === "map" ? "Map" : "Agent"}`}
                            </button>

                            {status === "success" && (
                                <p className="text-xs text-green-400">
                                    {type === "map" ? "Map" : "Agent"} created successfully.
                                </p>
                            )}
                            {status === "error" && (
                                <p className="text-xs text-red-400">Something went wrong. Please try again.</p>
                            )}
                        </div>
                    </main>
                )}
            </div>
        </div>
    );
}