import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Map } from "lucide-react";
import { FilterPanel } from "./FilterPanel";
import { StatsPanel } from "./StatsPanel";

export const Sidebar = ({ filters, filtered, options, toggleFilter, setSearch, resetFilters, activeFilterCount, totalCount }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            <button
                onClick={() => setCollapsed((p) => !p)}
                className="absolute top-1/2 -translate-y-1/2 z-[1001] w-6 h-12 bg-white shadow-lg border border-slate-100 rounded-r-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
                style={{ left: collapsed ? "0px" : "320px" }}
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div
                className={`absolute left-0 top-0 h-full z-[1000] bg-white/97 backdrop-blur-xl shadow-2xl border-r border-slate-100 flex flex-col transition-all duration-300 ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
                style={{ width: "320px" }}
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
                            placeholder="Cari nama objek, kab/kota..."
                            value={filters.searchQuery}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="px-4">
                    <StatsPanel filtered={filtered.length} total={totalCount} />
                </div>

                {/* Filter Header */}
                <div className="px-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal size={14} className="text-slate-500" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter</span>
                        {activeFilterCount > 0 && <span className="bg-slate-800 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                    </div>
                    {activeFilterCount > 0 && (
                        <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors">
                            <X size={12} /> Reset
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex-1 overflow-y-auto sidebar-scroll px-4 pb-6">
                    <FilterPanel filters={filters} options={options} toggleFilter={toggleFilter} />
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 text-center">
                        Menampilkan <span className="font-semibold text-slate-700">{filtered.length}</span> dari <span className="font-semibold text-slate-700">{totalCount}</span> objek KBAK
                    </p>
                </div>
            </div>
        </>
    );
};
