import { updatePlayer } from '@/ApiPosters';
import { roles } from '@/Constants';
import { getButtonClass } from '@/Utilities';
import { useState } from 'react';

export default function AddPlayerWithoutTeamDialog() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [igl, setIgl] = useState(false);

    const reset = () => {
        setName('');
        setRole('');
        setIgl(false);
    };

    const handleSave = async () => {
        await updatePlayer({
            Id: -1,
            TeamId: null,
            Name: name,
            Role: role,
            IGL: igl
        });
        setOpen(false);
        reset();
    };

    return (
        <div>
            <button
                onClick={() => setOpen(true)}
                    className={"flex items-center gap-2 " + getButtonClass({
                        bg: "bg-blue-600", text: "text-white", hoverBg: "bg-blue-700", rounded: true, padding: "px-4 py-2", transition: true
                    })}>
                Add Player Without Team
            </button>

            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-lg w-96 space-y-4">
                        <h2 className="text-xl font-semibold">Add Player Without Team</h2>

                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        >
                            <option value="">-- Select Role --</option>
                            {roles.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>

                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={igl}
                                onChange={(e) => setIgl(e.target.checked)}
                                className="accent-blue-600"
                            />
                            <span>IGL</span>
                        </label>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    reset();
                                }}
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
