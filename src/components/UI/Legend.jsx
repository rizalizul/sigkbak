import { KBAK_LEVELS, KLASIFIKASI_COLORS } from "../../constants/mapConfig";
import { Layers } from "lucide-react";

export const Legend = ({ showKBAK, onToggleKBAK }) => (
    <div className="absolute bottom-8 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100 p-4 min-w-[200px]">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Klasifikasi Karst</p>
        {Object.entries(KLASIFIKASI_COLORS)
            .filter(([k]) => k !== "default")
            .map(([key, val]) => (
                <div key={key} className="flex items-center gap-2.5 mb-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: val.hex }} />
                    <span className="text-sm text-slate-700 font-medium">
                        {val.emoji} {key}
                    </span>
                </div>
            ))}

        <div className="my-3 border-t border-slate-100" />

        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
                <Layers size={13} className="text-slate-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Layer KBAK</p>
            </div>
            <button onClick={onToggleKBAK} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showKBAK ? "bg-green-600" : "bg-slate-200"}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${showKBAK ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
        </div>

        {showKBAK && (
            <div className="mt-1 space-y-1.5">
                {Object.entries(KBAK_LEVELS).map(([lvl, cfg]) => (
                    <div key={lvl} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0 border" style={{ backgroundColor: cfg.color + "66", borderColor: cfg.color }} />
                        <span className="text-xs text-slate-600">
                            Lvl {lvl} — {cfg.label}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
);
