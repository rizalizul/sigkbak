import { useState } from "react";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { Plus, Pencil, Trash2, Save, X, Loader2 } from "lucide-react";

const PRESET_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#6b7280", "#84cc16", "#f97316"];
const PRESET_ICONS = ["📍", "🕳️", "💧", "🪨", "🌿", "🏔️", "🌊", "🦇", "🌋", "🏛️", "⛰️", "🗺️", "🔍", "📌", "🌐"];

const JenisForm = ({ initial = {}, onSave, onCancel, loading }) => {
    const [nama, setNama] = useState(initial.nama || "");
    const [warna, setWarna] = useState(initial.warna || "#6b7280");
    const [ikon, setIkon] = useState(initial.ikon || "📍");
    const [deskripsi, setDeskripsi] = useState(initial.deskripsi || "");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ nama, warna, ikon, deskripsi });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Jenis Objek</label>
                <input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    placeholder="contoh: Gua Basah"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Warna Marker</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {PRESET_COLORS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setWarna(c)}
                            className={`w-7 h-7 rounded-lg border-2 transition-all ${warna === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <input type="color" value={warna} onChange={(e) => setWarna(e.target.value)} className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                    <span className="text-sm text-slate-500 font-mono">{warna}</span>
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: warna }} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ikon</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {PRESET_ICONS.map((ic) => (
                        <button
                            key={ic}
                            type="button"
                            onClick={() => setIkon(ic)}
                            className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${ikon === ic ? "border-slate-800 bg-slate-50" : "border-slate-100 hover:border-slate-300"}`}
                        >
                            {ic}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        value={ikon}
                        onChange={(e) => setIkon(e.target.value)}
                        maxLength={2}
                        placeholder="atau ketik emoji"
                        className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                    <span className="text-2xl">{ikon}</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Deskripsi <span className="text-slate-400">(opsional)</span>
                </label>
                <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    rows={2}
                    placeholder="Keterangan singkat tentang jenis objek ini"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all resize-none"
                />
            </div>

            {/* Preview marker */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                <span className="text-xs text-slate-500">Preview:</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-md" style={{ backgroundColor: warna }}>
                    {ikon}
                </div>
                <span className="text-sm font-medium text-slate-700">{nama || "Nama Jenis"}</span>
            </div>

            <div className="flex gap-2 pt-1">
                <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                    Batal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save size={14} />
                            Simpan
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export const JenisPage = () => {
    const { jenisList, createJenis, updateJenis, deleteJenis } = useJenisObjek();
    const [mode, setMode] = useState(null); // null | "add" | {id, ...}
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSave = async (payload) => {
        setSaving(true);
        setError(null);
        if (mode === "add") {
            const { error: err } = await createJenis(payload);
            if (err) setError(err.message);
            else setMode(null);
        } else {
            const { error: err } = await updateJenis(mode.id, payload);
            if (err) setError(err.message);
            else setMode(null);
        }
        setSaving(false);
    };

    const handleDelete = async (jenis) => {
        if (!confirm(`Hapus jenis "${jenis.nama}"? Semua objek dengan jenis ini akan kehilangan referensi.`)) return;
        const { error: err } = await deleteJenis(jenis.id);
        if (err) alert(err.message);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Jenis Objek</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Kelola jenis, warna, dan ikon marker</p>
                </div>
                {!mode && (
                    <button onClick={() => setMode("add")} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
                        <Plus size={15} /> Tambah Jenis
                    </button>
                )}
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}

            {/* Form tambah/edit */}
            {mode && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-slate-700 mb-4">{mode === "add" ? "Tambah Jenis Baru" : `Edit: ${mode.nama}`}</h2>
                    <JenisForm initial={mode === "add" ? {} : mode} onSave={handleSave} onCancel={() => setMode(null)} loading={saving} />
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {jenisList.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400 text-sm">Belum ada jenis objek.</p>
                        <button onClick={() => setMode("add")} className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
                            Tambah Sekarang
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Jenis</th>
                                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Deskripsi</th>
                                <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {jenisList.map((j) => (
                                <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-sm" style={{ backgroundColor: j.warna }}>
                                                {j.ikon}
                                            </div>
                                            <span className="text-sm font-medium text-slate-800">{j.nama}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{j.deskripsi || "—"}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setMode(j)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(j)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
