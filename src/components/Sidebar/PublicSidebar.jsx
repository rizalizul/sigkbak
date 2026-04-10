import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Map, LogIn } from "lucide-react";
import { LayerControl } from "./LayerControl";
import { useNavigate } from "react-router-dom";

export const PublicSidebar = ({ jenisList, activeJenisIds, onToggleJenis, showKBAK, onToggleKBAK, searchQuery, onSearch, totalObjek, filteredObjek, objekCount }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <button
                onClick={() => setCollapsed((p) => !p)}
                className="absolute top-1/2 -translate-y-1/2 z-[1001] w-6 h-12 bg-white shadow-lg border border-slate-100 rounded-r-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                style={{ left: collapsed ? "0px" : "300px" }}
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div
                className={`absolute left-0 top-0 h-full z-[1000] bg-white/97 backdrop-blur-xl shadow-2xl border-r border-slate-100 flex flex-col transition-all duration-300 ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
                style={{ width: "300px" }}
            >
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                            <Map size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900 leading-none">SIG KBAK Indonesia</h1>
                            <p className="text-xs text-slate-400 mt-0.5">Sistem Informasi Geografis</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="px-4 pt-4 pb-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama objek..."
                            value={searchQuery}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="px-4 pb-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-xs text-slate-400 mb-1">Ditampilkan</p>
                            <p className="text-xl font-bold text-slate-800">{filteredObjek.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-xs text-slate-400 mb-1">Total Objek</p>
                            <p className="text-xl font-bold text-slate-800">{totalObjek.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Layer Control */}
                <div className="flex-1 overflow-y-auto sidebar-scroll px-4 pb-4">
                    <LayerControl jenisList={jenisList} activeJenisIds={activeJenisIds} onToggleJenis={onToggleJenis} showKBAK={showKBAK} onToggleKBAK={onToggleKBAK} objekCount={objekCount} />
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100">
                    <button onClick={() => navigate("/login")} className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors">
                        <LogIn size={13} /> Masuk sebagai Editor
                    </button>
                </div>
            </div>
        </>
    );
};
