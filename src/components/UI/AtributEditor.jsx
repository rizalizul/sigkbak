import { useState, forwardRef, useImperativeHandle } from "react";
import { Plus, X } from "lucide-react";

export const AtributEditor = forwardRef(({ value = {}, onChange }, ref) => {
    const [entries, setEntries] = useState(() => Object.entries(value));
    const [errors, setErrors] = useState({});

    // Expose validate() ke parent
    useImperativeHandle(ref, () => ({
        validate: () => {
            const newErrors = {};
            entries.forEach(([k, v], idx) => {
                if ((!k || k.trim() === "") && v !== "" && v != null) {
                    newErrors[idx] = true;
                }
            });
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        },
    }));

    const update = (newEntries) => {
        setEntries(newEntries);
        // Clear error baris yang sudah diperbaiki
        setErrors((prev) => {
            const next = { ...prev };
            newEntries.forEach(([k, v], idx) => {
                if (k && k.trim() !== "") delete next[idx];
            });
            return next;
        });
        onChange(Object.fromEntries(newEntries.filter(([k]) => k.trim() !== "")));
    };

    const setKey = (idx, key) => {
        const n = [...entries];
        n[idx] = [key, n[idx][1]];
        update(n);
    };
    const setVal = (idx, val) => {
        const n = [...entries];
        n[idx] = [n[idx][0], val];
        update(n);
    };
    const remove = (idx) => {
        update(entries.filter((_, i) => i !== idx));
    };
    const add = () => update([...entries, ["", ""]]);

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div className="space-y-2">
            {entries.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Belum ada atribut. Klik tombol + untuk menambah.</p>}
            {entries.map(([k, v], idx) => (
                <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                        <input
                            value={k}
                            onChange={(e) => setKey(idx, e.target.value)}
                            placeholder="Nama field"
                            className={`w-2/5 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-800 transition-colors ${errors[idx] ? "border-rose-400 bg-rose-50 focus:ring-rose-400" : "border-slate-200 bg-slate-50"}`}
                        />
                        <span className="text-slate-300 text-xs flex-shrink-0">:</span>
                        <input
                            value={String(v ?? "")}
                            onChange={(e) => setVal(idx, e.target.value)}
                            placeholder="Nilai"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
                        />
                        <button type="button" onClick={() => remove(idx)} className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <X size={13} />
                        </button>
                    </div>
                    {errors[idx] && <p className="text-xs text-rose-500 pl-1">⚠ Nama field tidak boleh kosong</p>}
                </div>
            ))}

            {hasErrors && <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-600">Isi nama field yang masih kosong atau hapus baris tersebut sebelum menyimpan.</div>}

            <button type="button" onClick={add} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <Plus size={13} /> Tambah Atribut
            </button>
        </div>
    );
});

AtributEditor.displayName = "AtributEditor";
