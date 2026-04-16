import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { useObjekSpasial } from "../../hooks/useObjekSpasial";
import { supabase } from "../../lib/supabase";
import { AtributEditor } from "../../components/UI/AtributEditor";
import { MapPickerModal } from "../../components/UI/MapPickerModal";
import { Search, Trash2, ChevronDown, ChevronUp, Filter, Loader2, Plus, Pencil, X, Save, MapPin } from "lucide-react";

const ObjekForm = ({ initial = {}, jenisList, onSave, onCancel, saving }) => {
    const [form, setForm] = useState({
        jenis_id: initial.jenis_id ?? "",
        nama_objek: initial.nama_objek ?? "",
        koordinat_x: initial.koordinat_x ?? "",
        koordinat_y: initial.koordinat_y ?? "",
        atribut: initial.atribut ?? {},
    });
    const [showMapPicker, setShowMapPicker] = useState(false);
    const atributEditorRef = useRef(null);
    const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validasi AtributEditor sebelum simpan
        if (atributEditorRef.current && !atributEditorRef.current.validate()) {
            return; // Ada field kosong, hentikan submit
        }
        onSave({
            ...form,
            koordinat_x: parseFloat(form.koordinat_x) || null,
            koordinat_y: parseFloat(form.koordinat_y) || null,
        });
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jenis Objek</label>
                    <select value={form.jenis_id} onChange={(e) => set("jenis_id", e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800">
                        <option value="">Pilih jenis...</option>
                        {jenisList.map((j) => (
                            <option key={j.id} value={j.id}>
                                {j.ikon} {j.nama}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nama Objek</label>
                    <input
                        value={form.nama_objek}
                        onChange={(e) => set("nama_objek", e.target.value)}
                        required
                        placeholder="Nama objek..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                </div>

                {/* Koordinat */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-600">Koordinat</label>
                        <button type="button" onClick={() => setShowMapPicker(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                            <MapPin size={12} /> Pilih dari Peta
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Longitude (X)</label>
                            <input
                                type="number"
                                step="any"
                                value={form.koordinat_x}
                                onChange={(e) => set("koordinat_x", e.target.value)}
                                placeholder="109.xxxx"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Latitude (Y)</label>
                            <input
                                type="number"
                                step="any"
                                value={form.koordinat_y}
                                onChange={(e) => set("koordinat_y", e.target.value)}
                                placeholder="-7.xxxx"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                            />
                        </div>
                    </div>
                </div>

                {/* Atribut */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Atribut Tambahan</label>
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                        <AtributEditor ref={atributEditorRef} value={form.atribut} onChange={(val) => set("atribut", val)} />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                        Batal
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                        {saving ? (
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

            {showMapPicker && (
                <MapPickerModal
                    initialLat={form.koordinat_y}
                    initialLng={form.koordinat_x}
                    onConfirm={(lat, lng) => {
                        set("koordinat_y", lat);
                        set("koordinat_x", lng);
                        setShowMapPicker(false);
                    }}
                    onClose={() => setShowMapPicker(false)}
                />
            )}
        </>
    );
};

export const DataPage = () => {
    const { jenisList } = useJenisObjek();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedJenis, setSelectedJenis] = useState([]);
    const jenisIds = selectedJenis.length > 0 ? selectedJenis : jenisList.map((j) => j.id);

    const { filtered, loading, searchQuery, setSearchQuery, deleteObjek, updateObjek } = useObjekSpasial(jenisIds);
    const [expandedId, setExpandedId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState(null);
    const [formKey, setFormKey] = useState(0); // force re-render form
    const formRef = useRef(null);

    const openEdit = (obj) => {
        setMode(obj);
        setFormKey((k) => k + 1); // reset form
        setExpandedId(null);
        // Scroll ke form
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    };
    const [error, setError] = useState(null);

    // Auto-buka form edit jika ada query param ?edit=ID
    useEffect(() => {
        const editId = searchParams.get("edit");
        if (editId && filtered.length > 0) {
            const obj = filtered.find((o) => String(o.id) === editId);
            if (obj) {
                openEdit(obj);
                setSearchParams({}, { replace: true });
            }
        }
    }, [searchParams, filtered]); // eslint-disable-line

    const handleDelete = async (id, nama) => {
        if (!confirm(`Hapus objek "${nama}"?`)) return;
        setDeletingId(id);
        const { error: err } = await deleteObjek(id);
        if (err) alert(err.message);
        setDeletingId(null);
    };

    const handleSave = async (payload) => {
        setSaving(true);
        setError(null);
        if (mode === "add") {
            const { error: err } = await supabase.from("objek_spasial").insert(payload);
            if (err) setError(err.message);
            else setMode(null);
        } else {
            const { error: err } = await updateObjek(mode.id, payload);
            if (err) setError(err.message);
            else setMode(null);
        }
        setSaving(false);
    };

    const toggleJenisFilter = (id) => setSelectedJenis((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Kelola Data</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Lihat, tambah, edit, dan hapus objek</p>
                </div>
                {!mode && (
                    <button onClick={() => setMode("add")} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
                        <Plus size={15} /> Tambah Objek
                    </button>
                )}
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}

            {mode && (
                <div ref={formRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-700">{mode === "add" ? "✨ Tambah Objek Baru" : `✏️ Edit: ${mode.nama_objek}`}</h2>
                        <button onClick={() => setMode(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>
                    <ObjekForm key={formKey} initial={mode === "add" ? {} : mode} jenisList={jenisList} onSave={handleSave} onCancel={() => setMode(null)} saving={saving} />
                </div>
            )}

            {/* Filter & Search */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama objek atau atribut..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter size={13} className="text-slate-400" />
                    <span className="text-xs text-slate-400">Filter:</span>
                    {jenisList.map((j) => {
                        const active = selectedJenis.includes(j.id);
                        return (
                            <button
                                key={j.id}
                                onClick={() => toggleJenisFilter(j.id)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${active ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                                style={active ? { backgroundColor: j.warna } : {}}
                            >
                                {j.ikon} {j.nama}
                            </button>
                        );
                    })}
                    {selectedJenis.length > 0 && (
                        <button onClick={() => setSelectedJenis([])} className="text-xs text-rose-500 hover:text-rose-700 font-medium">
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Tabel */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">{loading ? "Memuat..." : `${filtered.length.toLocaleString()} objek`}</span>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                        <Loader2 size={18} className="animate-spin" /> Memuat data...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">Tidak ada data ditemukan.</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filtered.map((obj) => (
                            <div key={obj.id}>
                                <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === obj.id ? null : obj.id)}>
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: obj.jenis_objek?.warna || "#6b7280" }}>
                                        {obj.jenis_objek?.ikon || "📍"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{obj.nama_objek || "Tanpa Nama"}</p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {obj.jenis_objek?.nama} · {obj.atribut?.Provinsi ?? obj.atribut?.provinsi ?? "—"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEdit(obj);
                                            }}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(obj.id, obj.nama_objek);
                                            }}
                                            disabled={deletingId === obj.id}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                        >
                                            {deletingId === obj.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                        </button>
                                        {expandedId === obj.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                    </div>
                                </div>
                                {expandedId === obj.id && (
                                    <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-3">
                                            {obj.koordinat_x && (
                                                <div className="col-span-2">
                                                    <p className="text-xs text-slate-400">Koordinat</p>
                                                    <p className="text-xs font-medium text-slate-700">
                                                        {obj.koordinat_y?.toFixed(6)}, {obj.koordinat_x?.toFixed(6)}
                                                    </p>
                                                </div>
                                            )}
                                            {obj.atribut &&
                                                Object.entries(obj.atribut)
                                                    .filter(([, v]) => v != null && v !== "" && v !== "null")
                                                    .map(([k, v]) => (
                                                        <div key={k}>
                                                            <p className="text-xs text-slate-400">{k.replace(/_/g, " ")}</p>
                                                            <p className="text-xs font-medium text-slate-700">{String(v)}</p>
                                                        </div>
                                                    ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
