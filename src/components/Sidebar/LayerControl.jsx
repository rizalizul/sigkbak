import { useState } from "react";
import { Layers, ChevronDown, ChevronUp, Info } from "lucide-react";
import { KBAK_LEVELS } from "../../constants/mapConfig";

const KBAKLegend = ({ show }) => {
    if (!show) return null;
    return (
        <div className="ml-6 mt-1 space-y-1">
            {Object.entries(KBAK_LEVELS).map(([lvl, cfg]) => (
                <div key={lvl} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ backgroundColor: cfg.color + "66", borderColor: cfg.color }} />
                    <span className="text-xs text-slate-500">
                        Lvl {lvl} — {cfg.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

export const LayerControl = ({ jenisList, activeJenisIds, onToggleJenis, showKBAK, onToggleKBAK, objekCount }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100 p-4 min-w-[220px] max-w-[260px]">
            <button onClick={() => setCollapsed((p) => !p)} className="flex items-center justify-between w-full mb-3">
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Layer Tematik</span>
                </div>
                {collapsed ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronUp size={13} className="text-slate-400" />}
            </button>

            {!collapsed && (
                <div className="space-y-2">
                    {/* Jenis Objek dinamis */}
                    {jenisList.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">Belum ada data</p>
                    ) : (
                        jenisList.map((jenis) => {
                            const isActive = activeJenisIds.includes(jenis.id);
                            const count = objekCount[jenis.id] || 0;
                            return (
                                <label key={jenis.id} className="flex items-center gap-2.5 cursor-pointer group">
                                    <input type="checkbox" checked={isActive} onChange={() => onToggleJenis(jenis.id)} className="w-4 h-4 rounded accent-slate-800 cursor-pointer" />
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: jenis.warna }} />
                                    <span className="text-sm text-slate-700 flex-1 group-hover:text-slate-900 transition-colors">
                                        {jenis.ikon} {jenis.nama}
                                    </span>
                                    {count > 0 && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-lg">{count}</span>}
                                </label>
                            );
                        })
                    )}

                    <div className="border-t border-slate-100 pt-2 mt-2">
                        {/* KBAK Layer */}
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input type="checkbox" checked={showKBAK} onChange={onToggleKBAK} className="w-4 h-4 rounded accent-slate-800 cursor-pointer" />
                            <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ backgroundColor: "#16a34a44", borderColor: "#16a34a" }} />
                            <span className="text-sm text-slate-700 flex-1 group-hover:text-slate-900 transition-colors">🗺️ Layer KBAK</span>
                            <Info size={12} className="text-slate-300" />
                        </label>
                        <KBAKLegend show={showKBAK} />
                    </div>
                </div>
            )}
        </div>
    );
};
