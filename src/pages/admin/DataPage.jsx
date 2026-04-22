import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { useObjekSpasial } from "../../hooks/useObjekSpasial";
import { supabase } from "../../lib/supabase";
import { AtributEditor } from "../../components/UI/AtributEditor";
import { MapPickerModal } from "../../components/UI/MapPickerModal";
import { Search, Trash2, ChevronDown, ChevronUp, Filter, Loader2, Plus, Pencil, X, Save, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

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
        if (atributEditorRef.current && !atributEditorRef.current.validate()) return;
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
                            <input type="number" step="any" value={form.koordinat_x} onChange={(e) => set("koordinat_x", e.target.value)} placeholder="109.xxxx" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Latitude (Y)</label>
                            <input type="number" step="any" value={form.koordinat_y} onChange={(e) => set("koordinat_y", e.target.value)} placeholder="-7.xxxx" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800" />
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
                    <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : <><Save size={14} /> Simpan</>}
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

    const { filtered, loading, searchQuery, setSearchQuery, createObjek, deleteObjek, updateObjek } = useObjekSpasial(jenisIds);
    
    // --- STATE PAGINATION & BULK DELETE ---
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const ITEMS_PER_PAGE = 100;

    const [expandedId, setExpandedId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState(null);
    const [formKey, setFormKey] = useState(0);
    const [error, setError] = useState(null);
    const formRef = useRef(null);

    // Reset pagination dan seleksi jika melakukan pencarian atau filter
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [searchQuery, selectedJenis]);

    // Kalkulasi Data Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const openEdit = (obj) => {
        setMode(obj);
        setFormKey((k) => k + 1);
        setExpandedId(null);
        setTimeout(() => { formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50);
    };

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
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    };

    // Hapus Massal (Bulk Delete)
    const handleBulkDelete = async () => {
        if (!confirm(`YAKIN INGIN MENGHAPUS ${selectedIds.length} OBJEK SEKALIGUS?\nTindakan ini tidak dapat dibatalkan.`)) return;
        setIsDeletingBulk(true);
        // Loop penghapusan satu per satu
        for (const id of selectedIds) {
            await deleteObjek(id);
        }
        setSelectedIds([]);
        setIsDeletingBulk(false);
    };

    const handleSave = async (payload) => {
        setSaving(true);
        setError(null);
        if (mode === "add") {
            const { error: err } = await createObjek(payload);
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

    // Fungsi Centang Checkbox
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const currentIds = paginatedData.map(obj => obj.id);
            setSelectedIds(prev => [...new Set([...prev, ...currentIds])]);
        } else {
            const currentIds = paginatedData.map(obj => obj.id);
            setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
        }
    };

    const handleSelectOne = (e, id) => {
        e.stopPropagation();
        if (e.target.checked) setSelectedIds(prev => [...prev, id]);
        else setSelectedIds(prev => prev.filter(item => item !== id));
    };

    // Mengecek apakah semua item di halaman ini terpilih
    const isAllCurrentPageSelected = paginatedData.length > 0 && paginatedData.every(obj => selectedIds.includes(obj.id));

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
                        <button onClick={() => setSelectedJenis([])} className="text-xs text-rose-500 hover:text-rose-700 font-medium">Reset</button>
                    )}
                </div>
            </div>

            {/* Tabel */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header Dinamis: Normal vs Mode Bulk Delete */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    {selectedIds.length > 0 ? (
                        <div className="flex items-center gap-3 w-full">
                            <input 
                                type="checkbox" 
                                checked={isAllCurrentPageSelected}
                                onChange={handleSelectAll} 
                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                            />
                            <span className="text-sm font-semibold text-slate-700">{selectedIds.length} objek dipilih</span>
                            <div className="flex-1"></div>
                            <button 
                                onClick={handleBulkDelete}
                                disabled={isDeletingBulk}
                                className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-200 transition-colors disabled:opacity-50"
                            >
                                {isDeletingBulk ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                Hapus Terpilih
                            </button>
                            <button onClick={() => setSelectedIds([])} className="text-xs text-slate-500 hover:text-slate-800 font-medium">Batal</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 w-full">
                            <input 
                                type="checkbox" 
                                checked={isAllCurrentPageSelected}
                                onChange={handleSelectAll} 
                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                            />
                            <span className="text-sm font-semibold text-slate-700">
                                {loading ? "Memuat..." : `Menampilkan ${filtered.length > 0 ? startIndex + 1 : 0} - ${Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} dari total ${filtered.length.toLocaleString()} objek`}
                            </span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                        <Loader2 size={18} className="animate-spin" /> Memuat data...
                    </div>
                ) : paginatedData.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">Tidak ada data ditemukan.</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {paginatedData.map((obj) => (
                            <div key={obj.id}>
                                <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === obj.id ? null : obj.id)}>
                                    {/* Checkbox Individual */}
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(obj.id)}
                                        onChange={(e) => handleSelectOne(e, obj.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                    />
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2 border-white shadow-sm bg-white">
                                        {obj.jenis_objek?.ikon ? (
                                            obj.jenis_objek.ikon.endsWith('.svg') || obj.jenis_objek.ikon.endsWith('.png') ? (
                                                <img src={`/icons/${obj.jenis_objek.ikon}`} alt="ikon" className="w-4 h-4 object-contain" />
                                            ) : (
                                                <span style={{ backgroundColor: obj.jenis_objek?.warna || "#6b7280" }} className="w-full h-full rounded-full flex items-center justify-center">{obj.jenis_objek.ikon}</span>
                                            )
                                        ) : "📍"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{obj.nama_objek || "Tanpa Nama"}</p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {obj.jenis_objek?.nama} · {obj.atribut?.Provinsi ?? obj.atribut?.provinsi ?? "—"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEdit(obj); }}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(obj.id, obj.nama_objek); }}
                                            disabled={deletingId === obj.id || isDeletingBulk}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                        >
                                            {deletingId === obj.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                        </button>
                                        {expandedId === obj.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                    </div>
                                </div>
                                {expandedId === obj.id && (
                                    <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100 ml-7">
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
                
                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-white">
                        <span className="text-xs text-slate-500 font-medium">Halaman {currentPage} dari {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
