import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FilterGroup = ({ title, options, selected, onToggle }) => {
    const [open, setOpen] = useState(false);
    if (!options || options.length === 0) return null;

    return (
        <div className="border-t border-slate-100 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
            <button onClick={() => setOpen((p) => !p)}
                className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
                <span>{title}</span>
                <div className="flex items-center gap-1.5">
                    {selected.length > 0 && (
                        <span className="text-xs font-bold text-white bg-emerald-600 w-4 h-4 rounded-full flex items-center justify-center">
                            {selected.length}
                        </span>
                    )}
                    {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </div>
            </button>

            {open && (
                <div className="mt-1.5 flex flex-col gap-1.5 max-h-48 overflow-y-auto sidebar-scroll">
                    {options.map((opt) => {
                        const active = selected.includes(opt);
                        return (
                            <button key={opt} onClick={() => onToggle(opt)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2.5 ${
                                    active
                                        ? "bg-emerald-600 text-white font-medium shadow-sm"
                                        : "bg-slate-50 border border-slate-100 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                }`}>
                                <div className={`w-3 h-3 rounded-sm border flex-shrink-0 transition-colors ${active ? "bg-white border-white" : "border-slate-300"}`} />
                                <span className="truncate">{opt}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const FilterPanel = ({ filters, options, toggleFilter }) => {
    const safeFilters = filters || { provinsi: [], kota: [], klasifikasi: [] };
    const safeOptions = options || { provinsi: [], kota: [], klasifikasi: [] };

    const totalActive = safeFilters.provinsi.length + safeFilters.kota.length + safeFilters.klasifikasi.length;
    if (safeOptions.provinsi.length === 0 && safeOptions.kota.length === 0 && safeOptions.klasifikasi.length === 0)
        return <p className="text-xs text-slate-400 text-center py-3">Aktifkan layer untuk memuat filter</p>;

    return (
        <div className="mt-1">
            {totalActive > 0 && (
                <p className="text-xs text-emerald-600 font-medium mb-2">
                    {totalActive} filter aktif
                </p>
            )}
            <FilterGroup title="Provinsi"         options={safeOptions.provinsi}    selected={safeFilters.provinsi}    onToggle={(v) => toggleFilter("provinsi", v)} />
            <FilterGroup title="Kota / Kabupaten" options={safeOptions.kota}        selected={safeFilters.kota}        onToggle={(v) => toggleFilter("kota", v)} />
            <FilterGroup title="Klasifikasi Karst" options={safeOptions.klasifikasi} selected={safeFilters.klasifikasi} onToggle={(v) => toggleFilter("klasifikasi", v)} />
        </div>
    );
};