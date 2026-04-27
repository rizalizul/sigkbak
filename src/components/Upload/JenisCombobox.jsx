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

    // Fungsi kecil untuk merender ikon (Hybrid)
    const renderIkon = (ikon, warna) => {
        const isImage = ikon?.startsWith("http") || ikon?.includes("/");
        const isTransparent = warna === "transparent";
        return (
            <div 
                className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${isTransparent ? "" : "rounded-full shadow-sm"}`} 
                style={{ backgroundColor: isTransparent ? "transparent" : warna }}
            >
                {isImage ? (
                    <img src={ikon} alt="ikon" className={`w-full h-full object-contain p-0.5 ${isTransparent ? 'drop-shadow-sm' : ''}`} />
                ) : (
                    <span className={`text-xs ${isTransparent ? 'drop-shadow-sm' : ''}`}>{ikon}</span>
                )}
            </div>
        );
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
                        {renderIkon(selected.ikon, selected.warna)}
                        <span className="font-medium text-slate-700">{selected.nama}</span>
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
                                {renderIkon(j.ikon, j.warna)}
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
