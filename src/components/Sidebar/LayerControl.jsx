import { useState } from "react";
import { Layers, ChevronDown, ChevronUp, Info } from "lucide-react";
import { KBAK_LEVELS } from "../../constants/mapConfig";

const KBAKLegend = ({ show }) => {
    if (!show) return null;
    return (
        <div className="ml-6 mt-1.5 space-y-1.5">
            {Object.entries(KBAK_LEVELS).map(([lvl, cfg]) => (
                <div key={lvl} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm border flex-shrink-0"
                        style={{ backgroundColor: cfg.color + "55", borderColor: cfg.color }} />
                    <span className="text-xs text-slate-500">Lvl {lvl} — {cfg.label}</span>
                </div>
            ))}
        </div>
    );
};

export const LayerControl = ({ jenisList, activeJenisIds, onToggleJenis, showKBAK, onToggleKBAK, objekCount }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <button onClick={() => setCollapsed((p) => !p)}
                className="flex items-center justify-between w-full mb-3">
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Layer Tematik</span>
                </div>
                {collapsed
                    ? <ChevronDown size={13} className="text-slate-400" />
                    : <ChevronUp size={13} className="text-slate-400" />}
            </button>

            {!collapsed && (
                <div className="flex flex-col gap-[2px]">
                    {jenisList.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3">
                            Belum ada data. Centang jenis untuk memuat.
                        </p>
                    ) : (
                        jenisList.map((jenis) => {
                            const isActive     = activeJenisIds.includes(jenis.id);
                            const count        = objekCount[jenis.id] || 0;
                            const isImage      = jenis.ikon?.startsWith("http") || jenis.ikon?.includes("/");
                            const isTransparent = jenis.warna === "transparent";

                            return (
                                <label key={jenis.id}
                                    className={`flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-xl transition-colors ${isActive ? "bg-emerald-50" : "hover:bg-slate-50"}`}>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => onToggleJenis(jenis.id)}
                                        className="w-4 h-4 rounded accent-emerald-600 cursor-pointer flex-shrink-0"
                                    />
                                    <div
                                        className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${isTransparent ? "" : "rounded-full shadow-sm border border-white"}`}
                                        style={{ backgroundColor: isTransparent ? "transparent" : jenis.warna }}>
                                        {isImage
                                            ? <img src={jenis.ikon} alt="ikon" className="w-full h-full object-contain p-0.5" />
                                            : <span className="text-[10px]">{jenis.ikon}</span>}
                                    </div>
                                    <span className={`text-sm flex-1 transition-colors truncate ${isActive ? "text-emerald-800 font-medium" : "text-slate-700 group-hover:text-slate-900"}`}>
                                        {jenis.nama}
                                    </span>
                                    {count > 0 && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded-lg flex-shrink-0 ${isActive ? "bg-emerald-100 text-emerald-700 font-semibold" : "bg-slate-100 text-slate-400"}`}>
                                            {count.toLocaleString()}
                                        </span>
                                    )}
                                </label>
                            );
                        })
                    )}

                    {/* KBAK Layer */}
                    <div className="border-t border-slate-100 pt-2.5 mt-1">
                        <label className={`flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-xl transition-colors ${showKBAK ? "bg-green-50" : "hover:bg-slate-50"}`}>
                            <input
                                type="checkbox"
                                checked={showKBAK}
                                onChange={onToggleKBAK}
                                className="w-4 h-4 rounded accent-green-600 cursor-pointer flex-shrink-0"
                            />
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                <div className="w-3.5 h-3.5 rounded-sm border-2"
                                    style={{ backgroundColor: "#16a34a33", borderColor: "#16a34a" }} />
                            </div>
                            <span className={`text-sm flex-1 transition-colors ${showKBAK ? "text-green-800 font-medium" : "text-slate-700 group-hover:text-slate-900"}`}>
                                🗺️ Layer KBAK
                            </span>
                            <Info size={12} className="text-slate-300 flex-shrink-0" title="Kawasan Bentang Alam Karst" />
                        </label>
                        <KBAKLegend show={showKBAK} />
                    </div>
                </div>
            )}
        </div>
    );
};
