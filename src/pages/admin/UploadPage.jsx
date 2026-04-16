import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { usePreview } from "../../hooks/usePreview";
import { parseShapefiles, parseExcel } from "../../utils/parseFile";
import { JenisCombobox } from "../../components/Upload/JenisCombobox";
import { ColumnSelector } from "../../components/Upload/ColumnSelector";
import { ReviewPanel } from "../../components/Upload/ReviewPanel";
import { Upload, X, FileArchive, FileSpreadsheet, File, Loader2, AlertCircle, CheckCircle } from "lucide-react";

const PRESET_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#6b7280"];
const PRESET_ICONS = ["📍", "🕳️", "💧", "🪨", "🌿", "🏔️", "🌊", "🦇", "🌋", "🏛️", "⛰️", "🗺️"];

// Step indicator
const StepBar = ({ step }) => {
    const steps = ["Upload", "Pilih Kolom", "Review"];
    const idx = { upload: 0, columns: 1, review: 2 }[step];
    return (
        <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= idx ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>{i < idx ? "✓" : i + 1}</div>
                    <span className={`text-sm font-medium ${i === idx ? "text-slate-800" : "text-slate-400"}`}>{s}</span>
                    {i < steps.length - 1 && <div className={`flex-1 h-px w-8 ${i < idx ? "bg-slate-800" : "bg-slate-200"}`} />}
                </div>
            ))}
        </div>
    );
};

export const UploadPage = () => {
    const { jenisList, createJenis } = useJenisObjek();
    const { items, addItems, updateItem, discardItem, discardAll, clearSaved, saveItem, saveAll, savingAll, duplicateMap } = usePreview();

    const [files, setFiles] = useState([]);
    const [selectedJenisId, setSelectedJenisId] = useState(null);
    const [parsedItems, setParsedItems] = useState([]);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState("upload");

    // Buat jenis baru inline
    const [newJenisName, setNewJenisName] = useState(null);
    const [newJenisWarna, setNewJenisWarna] = useState("#6b7280");
    const [newJenisIkon, setNewJenisIkon] = useState("📍");
    const [creatingJenis, setCreatingJenis] = useState(false);

    const onDrop = useCallback((accepted) => {
        setFiles((prev) => {
            const names = new Set(prev.map((f) => f.name));
            return [...prev, ...accepted.filter((f) => !names.has(f.name))];
        });
        setError(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        accept: {
            "application/zip": [".zip"],
            "application/octet-stream": [".shp", ".dbf", ".prj", ".shx"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
        },
    });

    const getFileIcon = (name) => {
        const ext = name.split(".").pop().toLowerCase();
        if (ext === "zip") return <FileArchive size={14} className="text-amber-500" />;
        if (["xlsx", "xls"].includes(ext)) return <FileSpreadsheet size={14} className="text-green-500" />;
        return <File size={14} className="text-blue-500" />;
    };

    const handleCreateNew = (nama) => {
        setNewJenisName(nama);
        setSelectedJenisId(null);
    };

    const handleSaveNewJenis = async () => {
        setCreatingJenis(true);
        const { data, error: err } = await createJenis({ nama: newJenisName, warna: newJenisWarna, ikon: newJenisIkon });
        if (err) setError(err.message);
        else {
            setSelectedJenisId(data.id);
            setNewJenisName(null);
        }
        setCreatingJenis(false);
    };

    const handleProcess = async () => {
        if (!files.length || !selectedJenisId) return;
        setParsing(true);
        setError(null);
        try {
            const isExcel = files.some((f) => /\.(xlsx|xls)$/i.test(f.name));
            let parsed = isExcel ? parseExcel(await files.find((f) => /\.(xlsx|xls)$/i.test(f.name)).arrayBuffer()) : await parseShapefiles(files);
            if (!parsed.length) throw new Error("Tidak ada data yang berhasil dibaca.");
            setParsedItems(parsed);
            setStep("columns");
        } catch (err) {
            setError(err.message);
        }
        setParsing(false);
    };

    const handleColumnsConfirm = (filteredItems) => {
        addItems(filteredItems, selectedJenisId);
        setStep("review");
        setFiles([]);
    };

    const handleReset = () => {
        discardAll();
        setStep("upload");
        setFiles([]);
        setSelectedJenisId(null);
        setParsedItems([]);
        setError(null);
    };

    return (
        <div className="space-y-2">
            <StepBar step={step} />

            {/* ── Step: Pilih Kolom ── */}
            {step === "columns" && <ColumnSelector items={parsedItems} onConfirm={handleColumnsConfirm} onBack={() => setStep("upload")} />}

            {/* ── Step: Review ── */}
            {step === "review" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Review Data</h1>
                            <p className="text-sm text-slate-400 mt-0.5">Periksa, edit, lalu simpan ke database</p>
                        </div>
                        <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                            <Upload size={14} /> Upload Lagi
                        </button>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <ReviewPanel items={items} onSave={saveItem} onDiscard={discardItem} onSaveAll={saveAll} onDiscardAll={discardAll} onClearSaved={clearSaved} onUpdate={updateItem} savingAll={savingAll} duplicateMap={duplicateMap} />
                    </div>
                </div>
            )}

            {/* ── Step: Upload ── */}
            {step === "upload" && (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Upload Data</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Import objek spasial dari Shapefile atau Excel</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                        {/* Step 1: Jenis */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">1. Pilih Jenis Objek</label>
                            <JenisCombobox jenisList={jenisList} value={selectedJenisId} onChange={setSelectedJenisId} onCreateNew={handleCreateNew} />
                        </div>

                        {/* Form buat jenis baru */}
                        {newJenisName && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                                <p className="text-sm font-semibold text-emerald-800">Buat Jenis Baru: "{newJenisName}"</p>
                                <div>
                                    <p className="text-xs text-slate-600 mb-2">Pilih warna:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setNewJenisWarna(c)}
                                                className={`w-7 h-7 rounded-lg border-2 transition-all ${newJenisWarna === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <input type="color" value={newJenisWarna} onChange={(e) => setNewJenisWarna(e.target.value)} className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600 mb-2">Pilih ikon:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PRESET_ICONS.map((ic) => (
                                            <button
                                                key={ic}
                                                type="button"
                                                onClick={() => setNewJenisIkon(ic)}
                                                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border-2 transition-all ${newJenisIkon === ic ? "border-slate-800 bg-white" : "border-slate-100 hover:border-slate-300"}`}
                                            >
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-md" style={{ backgroundColor: newJenisWarna }}>
                                        {newJenisIkon}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{newJenisName}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setNewJenisName(null)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-white transition-colors">
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSaveNewJenis}
                                        disabled={creatingJenis}
                                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {creatingJenis ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                        Simpan Jenis
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: File */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">2. Upload File</label>
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? "border-slate-800 bg-slate-50" : "border-slate-200 hover:border-slate-400"}`}>
                                <input {...getInputProps()} />
                                <Upload size={28} className="text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-slate-700 mb-1">{isDragActive ? "Lepas file di sini..." : "Drag & drop atau klik untuk pilih"}</p>
                                <p className="text-xs text-slate-400">.zip · .shp · .dbf · .prj · .xlsx · .xls</p>
                            </div>

                            {files.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                    {files.map((f) => (
                                        <div key={f.name} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                                            {getFileIcon(f.name)}
                                            <span className="text-xs text-slate-700 truncate flex-1">{f.name}</span>
                                            <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                                            <button onClick={() => setFiles((p) => p.filter((x) => x.name !== f.name))} className="text-slate-400 hover:text-rose-500 ml-1">
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleProcess}
                            disabled={!files.length || !selectedJenisId || parsing || !!newJenisName}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {parsing ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Proses & Pilih Kolom →"
                            )}
                        </button>
                        {!selectedJenisId && <p className="text-xs text-center text-slate-400">Pilih jenis objek terlebih dahulu</p>}
                    </div>
                </div>
            )}
        </div>
    );
};
