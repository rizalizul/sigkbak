import { useState } from "react";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { supabase } from "../../lib/supabase";
import { Plus, Pencil, Trash2, Save, X, Loader2, Upload, Ban } from "lucide-react";

const PRESET_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#6b7280", "#84cc16", "#f97316"];
const PRESET_ICONS = ["📍", "🕳️", "💧", "🪨", "🌿", "🏔️", "🌊", "🦇", "🌋", "🏛️", "⛰️", "🗺️", "🔍", "📌", "🌐"];

const JenisForm = ({ initial = {}, onSave, onCancel, loading }) => {
    const [nama, setNama] = useState(initial.nama || "");
    const [warna, setWarna] = useState(initial.warna || "#6b7280");
    const [ikon, setIkon] = useState(initial.ikon || "📍");
    const [deskripsi, setDeskripsi] = useState(initial.deskripsi || "");
    
    const isImage = ikon?.startsWith("http") || ikon?.includes("/");
    const [iconMode, setIconMode] = useState(isImage ? "upload" : "emoji");
    const [uploading, setUploading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ nama, warna, ikon, deskripsi });
    };

    // Fungsi Upload ke Supabase
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi ekstensi
        if (!file.type.includes('svg') && !file.type.includes('png')) {
            alert("Harap unggah file dengan format .svg atau .png");
            return;
        }

        if (file.size > 512000) {
            alert("Gagal: Ukuran file terlalu besar! Maksimal ukuran ikon adalah 500 KB.");
            e.target.value = '';
            return;
        }

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `ikon_resmi/${fileName}`; // Disimpan di dalam subfolder agar rapi

        // Proses unggah ke bucket 'kustom_ikon'
        const { error: uploadError } = await supabase.storage.from("kustom_ikon").upload(filePath, file);

        if (uploadError) {
            alert("Gagal mengunggah file: " + uploadError.message);
        } else {
            // Ambil URL Publik
            const { data: publicUrlData } = supabase.storage.from("kustom_ikon").getPublicUrl(filePath);
            setIkon(publicUrlData.publicUrl);
        }
        setUploading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Jenis Objek</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="contoh: Gua Basah" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all" />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Warna Marker</label>
                <div className="flex flex-wrap gap-2 mb-2 items-center">
                    {/* Tombol Transparan */}
                    <button
                        type="button"
                        onClick={() => setWarna("transparent")}
                        title="Transparan (Tanpa Background)"
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all bg-slate-50 text-slate-400 ${warna === "transparent" ? "border-slate-800 scale-110 text-slate-800" : "border-slate-200 hover:border-slate-400"}`}
                    >
                        <Ban size={14} />
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                    
                    {/* Warna Preset */}
                    {PRESET_COLORS.map((c) => (
                        <button key={c} type="button" onClick={() => setWarna(c)} className={`w-7 h-7 rounded-lg border-2 transition-all ${warna === c ? "border-slate-800 scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                </div>
                {/* Custom Color Picker (Hanya aktif jika tidak transparan) */}
                {warna !== "transparent" && (
                    <div className="flex items-center gap-3">
                        <input type="color" value={warna} onChange={(e) => setWarna(e.target.value)} className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                        <span className="text-sm text-slate-500 font-mono">{warna}</span>
                    </div>
                )}
            </div>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Ikon Marker</label>
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                        <button type="button" onClick={() => setIconMode("emoji")} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${iconMode === "emoji" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>Emoji</button>
                        <button type="button" onClick={() => setIconMode("upload")} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${iconMode === "upload" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>Upload SVG/PNG</button>
                    </div>
                </div>

                {iconMode === "emoji" ? (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {PRESET_ICONS.map((ic) => (
                                <button key={ic} type="button" onClick={() => setIkon(ic)} className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${ikon === ic ? "border-slate-800 bg-slate-50" : "border-slate-100 hover:border-slate-300"}`}>{ic}</button>
                            ))}
                        </div>
                        <input value={!isImage ? ikon : ""} onChange={(e) => setIkon(e.target.value)} maxLength={2} placeholder="Ketik emoji kustom..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800" />
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                        <input type="file" accept=".svg,.png" onChange={handleFileUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                        <div className="flex flex-col items-center gap-2">
                            {uploading ? (
                                <><Loader2 size={24} className="animate-spin text-slate-400" /><span className="text-sm text-slate-500 font-medium">Mengunggah...</span></>
                            ) : (
                                <><Upload size={24} className="text-slate-400" /><span className="text-sm font-medium text-slate-700">Klik untuk Pilih File Ikon</span><span className="text-xs text-slate-500">Mendukung .svg atau .png (Max 1MB)</span></>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi <span className="text-slate-400">(opsional)</span></label>
                <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={2} placeholder="Keterangan singkat..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all resize-none" />
            </div>

            {/* Preview marker UI (Disesuaikan dengan logika Transparan) */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
                <span className="text-xs text-slate-500">Preview:</span>
                <div 
                    className={`w-9 h-9 flex items-center justify-center text-sm ${warna === "transparent" ? "" : "rounded-full border-2 border-white shadow-md"}`} 
                    style={{ backgroundColor: warna === "transparent" ? "transparent" : warna }}
                >
                    {isImage ? <img src={ikon} className={`w-full h-full object-contain p-1 ${warna === "transparent" ? "drop-shadow-md" : ""}`} alt="ikon" /> : <span className={warna === "transparent" ? "text-2xl drop-shadow-md" : ""}>{ikon}</span>}
                </div>
                <span className="text-sm font-medium text-slate-700">{nama || "Nama Jenis"}</span>
            </div>

            <div className="flex gap-2 pt-1">
                <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={loading || uploading} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : <><Save size={14} /> Simpan</>}
                </button>
            </div>
        </form>
    );
};

export const JenisPage = () => {
    const { jenisList, createJenis, updateJenis, deleteJenis } = useJenisObjek();
    const [mode, setMode] = useState(null);
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
        if (!confirm(`Apakah Anda yakin ingin menghapus jenis "${jenis.nama}"?`)) return;
        const { error: err } = await deleteJenis(jenis.id);
        if (err) {
            if (err.message.includes("violates foreign key constraint") || err.code === "23503") {
                alert(`⚠️ GAGAL MENGHAPUS!\n\nJenis objek "${jenis.nama}" tidak bisa dihapus karena masih ada data spasial yang menggunakannya.\n\nSilakan pindahkan atau hapus data-data tersebut di menu 'Kelola Data' terlebih dahulu.`);
            } else alert("Terjadi kesalahan: " + err.message);
        }
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
                        <button onClick={() => setMode("add")} className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">Tambah Sekarang</button>
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
                                            {/* Merender Ikon di List Tabel */}
                                            <div 
                                                className={`w-9 h-9 flex items-center justify-center text-sm ${j.warna === "transparent" ? "" : "rounded-full border-2 border-white shadow-sm"}`} 
                                                style={{ backgroundColor: j.warna === "transparent" ? "transparent" : j.warna }}
                                            >
                                                {j.ikon?.startsWith("http") || j.ikon?.includes("/") 
                                                    ? <img src={j.ikon} className={`w-full h-full object-contain p-1 ${j.warna === "transparent" ? "drop-shadow-sm" : ""}`} alt="ikon" /> 
                                                    : <span className={j.warna === "transparent" ? "text-xl drop-shadow-sm" : ""}>{j.ikon}</span>}
                                            </div>
                                            <span className="text-sm font-medium text-slate-800">{j.nama}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{j.deskripsi || "—"}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setMode(j)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(j)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
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
