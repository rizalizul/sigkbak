import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react";

export const JenisCombobox = ({ jenisList, value, onChange, onCreateNew }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef(null);

    // Tutup dropdown kalau klik di luar
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = jenisList.find((j) => j.id === value);
    const filtered = jenisList.filter((j) => j.nama.toLowerCase().includes(query.toLowerCase()));
    const showCreate = query && !jenisList.some((j) => j.nama.toLowerCase() === query.toLowerCase());

    const handleSelect = (jenis) => {
        onChange(jenis.id);
        setQuery("");
        setOpen(false);
    };

    const handleCreate = () => {
        onCreateNew(query);
        setQuery("");
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all bg-white"
            >
                {selected ? (
                    <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: selected.warna }} />
                        {selected.ikon} {selected.nama}
                    </span>
                ) : (
                    <span className="text-slate-400">Pilih atau buat jenis baru...</span>
                )}
                <ChevronDown size={14} className="text-slate-400" />
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari atau ketik nama baru..." className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm focus:outline-none" />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.map((j) => (
                            <button key={j.id} type="button" onClick={() => handleSelect(j)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left">
                                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: j.warna }} />
                                <span>{j.ikon}</span>
                                <span className="text-slate-700">{j.nama}</span>
                            </button>
                        ))}
                        {showCreate && (
                            <button type="button" onClick={handleCreate} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-emerald-50 text-emerald-700 transition-colors text-left border-t border-slate-100">
                                <Plus size={14} />
                                Buat jenis baru: <span className="font-semibold">"{query}"</span>
                            </button>
                        )}
                        {filtered.length === 0 && !showCreate && <p className="text-center text-xs text-slate-400 py-4">Tidak ada jenis ditemukan</p>}
                    </div>
                </div>
            )}
        </div>
    );
};
