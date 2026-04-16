import { useState, useMemo } from "react";
import { Check, ChevronRight, Pencil } from "lucide-react";

export const ColumnSelector = ({ items, onConfirm, onBack }) => {
    const allColumns = useMemo(() => {
        const keys = new Set();
        items.forEach((item) => {
            if (item.atribut) Object.keys(item.atribut).forEach((k) => keys.add(k));
        });
        return [...keys];
    }, [items]);

    const [selected, setSelected] = useState(new Set(allColumns));
    // Map nama lama → nama baru
    const [renames, setRenames] = useState({}); // { "Nama Asli": "Nama Baru" }
    const [editingCol, setEditingCol] = useState(null);
    const [editVal, setEditVal] = useState("");

    const toggle = (col) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(col) ? next.delete(col) : next.add(col);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected(selected.size === allColumns.length ? new Set() : new Set(allColumns));
    };

    const startEdit = (col) => {
        setEditingCol(col);
        setEditVal(renames[col] ?? col);
    };

    const saveRename = (col) => {
        const trimmed = editVal.trim();
        if (trimmed && trimmed !== col) {
            setRenames((prev) => ({ ...prev, [col]: trimmed }));
        } else if (!trimmed) {
            // Reset ke nama asli
            setRenames((prev) => {
                const n = { ...prev };
                delete n[col];
                return n;
            });
        }
        setEditingCol(null);
    };

    const preview = items[0];

    const handleConfirm = () => {
        const filtered = items.map((item) => {
            const newAtribut = {};
            if (item.atribut) {
                Object.entries(item.atribut).forEach(([k, v]) => {
                    if (selected.has(k)) {
                        const newKey = renames[k] ?? k;
                        newAtribut[newKey] = v;
                    }
                });
            }
            return { ...item, atribut: newAtribut };
        });
        onConfirm(filtered);
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Pilih & Rename Kolom</h1>
                <p className="text-sm text-slate-400 mt-0.5">Pilih kolom yang ingin disimpan. Klik ✏️ untuk mengubah nama kolom.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                Ditemukan <span className="font-bold">{items.length}</span> objek dengan <span className="font-bold">{allColumns.length}</span> kolom atribut.
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Kolom wajib */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kolom Wajib</p>
                </div>
                {["Nama Objek", "Longitude (X)", "Latitude (Y)"].map((col) => (
                    <div key={col} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50">
                        <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-white" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{col}</span>
                        <span className="text-xs text-slate-400 ml-auto">Wajib</span>
                    </div>
                ))}

                {/* Kolom atribut */}
                <div className="px-5 py-3 bg-slate-50 border-y border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kolom Atribut</p>
                    <button onClick={toggleAll} className="text-xs text-slate-500 hover:text-slate-800 font-medium">
                        {selected.size === allColumns.length ? "Hapus Semua" : "Pilih Semua"}
                    </button>
                </div>

                {allColumns.length === 0 ? (
                    <div className="px-5 py-6 text-center text-sm text-slate-400">Tidak ada kolom atribut.</div>
                ) : (
                    <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto sidebar-scroll">
                        {allColumns.map((col) => {
                            const isSelected = selected.has(col);
                            const isEditing = editingCol === col;
                            const displayName = renames[col] ?? col;
                            const isRenamed = renames[col] && renames[col] !== col;
                            const previewVal = preview?.atribut?.[col];

                            return (
                                <div key={col} className={`flex items-center gap-3 px-5 py-3 transition-colors ${isSelected ? "hover:bg-slate-50" : "opacity-50"}`}>
                                    <div
                                        onClick={() => toggle(col)}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${isSelected ? "bg-slate-800 border-slate-800" : "border-slate-300"}`}
                                    >
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {isEditing ? (
                                            <input
                                                autoFocus
                                                value={editVal}
                                                onChange={(e) => setEditVal(e.target.value)}
                                                onBlur={() => saveRename(col)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") saveRename(col);
                                                    if (e.key === "Escape") setEditingCol(null);
                                                }}
                                                className="w-full px-2 py-1 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            />
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className={`text-sm font-medium ${isSelected ? "text-slate-800" : "text-slate-400"}`}>{displayName}</p>
                                                    {isRenamed && <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">dari: {col}</span>}
                                                </div>
                                                {previewVal != null && <p className="text-xs text-slate-400 truncate">Contoh: {String(previewVal)}</p>}
                                            </div>
                                        )}
                                    </div>

                                    {isSelected && !isEditing && (
                                        <button onClick={() => startEdit(col)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0">
                                            <Pencil size={13} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button onClick={onBack} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                    ← Kembali
                </button>
                <button onClick={handleConfirm} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                    Lanjut ke Review <ChevronRight size={15} />
                </button>
            </div>
        </div>
    );
};
