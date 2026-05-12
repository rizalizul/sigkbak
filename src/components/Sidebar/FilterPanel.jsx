import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const FilterGroup = ({ title, options, selected, onToggle }) => {
    const [open, setOpen] = useState(false); 
    
    if (!options || options.length === 0) return null;

    return (
        <div className="mt-4 border-t border-slate-200 pt-3">
            <button 
                onClick={() => setOpen((p) => !p)} 
                className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-400 tracking-wide hover:text-blue-600 transition-colors"
            >
                {title}
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {open && (
                <div className="mt-2.5 flex flex-col gap-2">
                    {options.map((opt) => {
                        const active = selected.includes(opt);
                        return (
                            <button
                                key={opt}
                                onClick={() => onToggle(opt)}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 ${
                                    active 
                                    ? "bg-slate-800 text-white font-medium shadow-md border border-slate-800" 
                                    : "bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-medium"
                                }`}
                            >
                                <div className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 transition-colors ${active ? "bg-white border-white" : "border-slate-300"}`} />
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

    return (
        <div className="mt-4 pb-2">
            <FilterGroup 
                title="Provinsi" 
                options={safeOptions.provinsi} 
                selected={safeFilters.provinsi} 
                onToggle={(v) => toggleFilter("provinsi", v)} 
            />
            <FilterGroup 
                title="Kota / Kabupaten" 
                options={safeOptions.kota} 
                selected={safeFilters.kota} 
                onToggle={(v) => toggleFilter("kota", v)} 
            />
            <FilterGroup 
                title="Klasifikasi Karst" 
                options={safeOptions.klasifikasi} 
                selected={safeFilters.klasifikasi} 
                onToggle={(v) => toggleFilter("klasifikasi", v)} 
            />
        </div>
    );
};