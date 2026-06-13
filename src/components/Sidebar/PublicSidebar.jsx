import { useState, useEffect, useRef } from "react";
import { Map, LogIn, LogOut, LayoutDashboard, SlidersHorizontal, X, ChevronUp, RotateCcw } from "lucide-react";
import { LayerControl } from "./LayerControl";
import { FilterPanel }  from "./FilterPanel";
import { useNavigate }  from "react-router-dom";
import { useAuth }      from "../../hooks/useAuth";

const ACCENT = {
    bg:      "bg-emerald-600",
    bgHover: "hover:bg-emerald-700",
    text:    "text-emerald-600",
    light:   "bg-emerald-50",
    border:  "border-emerald-200",
};

const countActiveFilters = (f) =>
    (f?.provinsi?.length ?? 0) + (f?.kota?.length ?? 0) + (f?.klasifikasi?.length ?? 0);

// ── User Avatar Button ────────────────────────────────────
const UserButton = ({ user, onLogin }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    if (!user) return (
        <button onClick={onLogin}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-sm text-slate-700 rounded-full shadow-md border border-slate-200 font-medium hover:bg-slate-50 hover:shadow-lg transition-all text-sm">
            <LogIn size={15} className="text-slate-500" /> Login
        </button>
    );

    return (
        <div ref={ref} className="relative">
            {/* Tombol avatar bulat dengan tooltip hover */}
            <button onClick={() => setOpen((p) => !p)}
                className="group relative flex items-center justify-center w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-slate-200 hover:bg-slate-50 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-inner">
                    {user.email?.[0]?.toUpperCase() || "U"}
                </div>
                {/* Tooltip */}
                <div className="absolute top-12 right-0 hidden group-hover:flex flex-col bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                    <span className="font-semibold">{user.user_metadata?.full_name || "Admin KBAK"}</span>
                    <span className="text-slate-300">{user.email}</span>
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    {/* Header info user */}
                    <div className="px-4 py-5 border-b border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 shadow-sm ring-4 ring-blue-100">
                            {user.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <p className="text-sm font-bold text-slate-800 truncate w-full">
                            {user.user_metadata?.full_name || "Admin KBAK"}
                        </p>
                        <p className="text-xs text-slate-500 truncate w-full mt-0.5">{user.email}</p>
                    </div>

                    <div className="p-2">
                        <button onClick={() => { setOpen(false); navigate("/admin/dashboard"); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium">
                            <LayoutDashboard size={16} className="text-slate-400" /> Admin Panel
                        </button>
                    </div>
                    <div className="p-2 border-t border-slate-100">
                        <button onClick={() => { setOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium">
                            <LogOut size={16} className="text-rose-500" /> Keluar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Stats row ─────────────────────────────────────────────
const StatsRow = ({ filteredObjek, totalObjek, hasAnyFilter, onResetFilters }) => (
    <div className="flex items-center justify-between px-2 bg-white rounded-2xl shadow-sm border border-slate-100">
        <p className="text-xs text-slate-600" style={{ textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}>
            Menampilkan{" "}
            <span
                className={`font-bold ${filteredObjek < totalObjek ? ACCENT.text : "text-slate-800"}`}
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
                {filteredObjek.toLocaleString()}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-slate-800" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
                {totalObjek.toLocaleString()}
            </span>{" "}
            objek
        </p>
        {hasAnyFilter && (
            <button onClick={onResetFilters}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors ml-2 flex-shrink-0">
                <RotateCcw size={11} /> Reset
            </button>
        )}
    </div>
);

// ── Isi sidebar (shared desktop & mobile) ─────────────────
const SidebarContent = ({
    jenisList, activeJenisIds, onToggleJenis,
    showKBAK, onToggleKBAK, objekCount,
    totalObjek, filteredObjek,
    attributeFilters, attributeOptions, onToggleAttributeFilter,
    onResetFilters, activeFilterCount,
}) => {
    const hasAnyFilter = activeFilterCount > 0;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-11 flex items-center justify-center flex-shrink-0">
                        <img 
                            src="/logo.png" 
                            alt="Logo KBAK" 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-1000 leading-none">Geoportal KBAK Indonesia</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Pusat Air Tanah dan Geologi Tata Lingkungan</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-4 pt-3 pb-2 flex-shrink-0">
                <StatsRow
                    filteredObjek={filteredObjek}
                    totalObjek={totalObjek}
                    hasAnyFilter={hasAnyFilter}
                    onResetFilters={onResetFilters}
                />
            </div>

            {/* Layer & Filter scrollable */}
            <div className="flex-1 overflow-y-auto sidebar-scroll px-4 pb-6 space-y-3 mt-1">
                <LayerControl
                    jenisList={jenisList}
                    activeJenisIds={activeJenisIds}
                    onToggleJenis={onToggleJenis}
                    showKBAK={showKBAK}
                    onToggleKBAK={onToggleKBAK}
                    objekCount={objekCount}
                />

                {totalObjek > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <SlidersHorizontal size={14} className="text-emerald-600" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter</span>
                            {activeFilterCount > 0 && (
                                <span className={`text-xs font-bold text-white ${ACCENT.bg} w-5 h-5 rounded-full flex items-center justify-center`}>
                                    {activeFilterCount}
                                </span>
                            )}
                        </div>
                        <FilterPanel
                            filters={attributeFilters}
                            options={attributeOptions}
                            toggleFilter={onToggleAttributeFilter}
                        />
                    </div>
                )}

                <p className="text-xs text-slate-400 text-center px-2">
                    💡 Gunakan kotak pencarian di atas peta untuk cari objek atau lokasi
                </p>
            </div>
        </div>
    );
};

// ── Main Export ───────────────────────────────────────────
export const PublicSidebar = ({
    jenisList, activeJenisIds, onToggleJenis,
    showKBAK, onToggleKBAK,
    totalObjek, filteredObjek, objekCount,
    user,
    attributeFilters, attributeOptions, onToggleAttributeFilter,
}) => {
    const navigate = useNavigate();
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [sheetState, setSheetState] = useState("collapsed"); // "collapsed" | "half" | "full"
    const touchStartY = useRef(null);
    const activeFilterCount = countActiveFilters(attributeFilters);

    const resetAllFilters = () => {
        ["provinsi", "kota", "klasifikasi"].forEach((cat) => {
            (attributeFilters[cat] || []).forEach((v) => onToggleAttributeFilter(cat, v));
        });
    };

    const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
    const onTouchEnd   = (e) => {
        if (touchStartY.current === null) return;
        const diff = touchStartY.current - e.changedTouches[0].clientY;
        if (diff > 50)       setSheetState((s) => s === "collapsed" ? "half" : "full");
        else if (diff < -50) setSheetState((s) => s === "full" ? "half" : "collapsed");
        touchStartY.current = null;
    };

    const sheetHeights = { collapsed: "68px", half: "55vh", full: "92vh" };

    const contentProps = {
        jenisList, activeJenisIds, onToggleJenis,
        showKBAK, onToggleKBAK, objekCount,
        totalObjek, filteredObjek,
        attributeFilters, attributeOptions, onToggleAttributeFilter,
        onResetFilters: resetAllFilters,
        activeFilterCount,
    };

    return (
        <>
            {/* ── DESKTOP sidebar ───────────────────────── */}
            <div className={`
                hidden md:flex absolute left-0 top-0 h-full z-[1000]
                bg-white/97 backdrop-blur-xl shadow-2xl border-r border-slate-100
                flex-col transition-all duration-300
                ${desktopCollapsed ? "w-0 overflow-hidden" : "w-[280px]"}
            `}>
                <SidebarContent {...contentProps} />
            </div>

            {/* Toggle button desktop */}
            <button
                onClick={() => setDesktopCollapsed((p) => !p)}
                className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-[1001] w-5 h-12 bg-white shadow-lg border border-slate-100 rounded-r-xl items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
                style={{ left: desktopCollapsed ? "0px" : "280px" }}>
                {desktopCollapsed
                    ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                    : <svg width="10" height="10" viewBox="0 0 10 10"><path d="M7 2L3 5l4 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                }
            </button>

            {/* ── MOBILE bottom sheet ───────────────────── */}
            <div
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                className="md:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl border-t border-slate-100 flex flex-col transition-all duration-300 ease-out"
                style={{ height: sheetHeights[sheetState] }}>

                {/* Drag handle area */}
                <div
                    className="flex-shrink-0 flex flex-col items-center px-4 pt-3 pb-2 cursor-pointer select-none"
                    onClick={() => setSheetState((s) => s === "collapsed" ? "half" : s === "half" ? "full" : "collapsed")}>
                    <div className="w-10 h-1 bg-slate-300 rounded-full mb-3" />

                    {/* Preview saat collapsed */}
                    {sheetState === "collapsed" && (
                        <div className="w-full flex items-center gap-3">
                            {/* Logo Mobile View */}
                            <div className="w-6 h-8 flex items-center justify-center flex-shrink-0">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 leading-none">Geoportal KBAK Indonesia</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    <span className={`font-bold ${ACCENT.text}`}>{filteredObjek.toLocaleString()}</span>
                                    {" "}dari {totalObjek.toLocaleString()} objek
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {activeFilterCount > 0 && (
                                    <span className={`text-xs font-bold text-white ${ACCENT.bg} w-5 h-5 rounded-full flex items-center justify-center`}>
                                        {activeFilterCount}
                                    </span>
                                )}
                                <ChevronUp size={16} className="text-slate-400" />
                            </div>
                        </div>
                    )}

                    {/* Title saat expand */}
                    {sheetState !== "collapsed" && (
                        <div className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {/* Logo Mobile Expand View */}
                                <div className="w-5 h-6 flex items-center justify-center flex-shrink-0">
                                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-sm font-bold text-slate-800">Geoportal KBAK Indonesia</span>
                                {activeFilterCount > 0 && (
                                    <span className={`text-xs font-bold text-white ${ACCENT.bg} w-5 h-5 rounded-full flex items-center justify-center`}>
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                {activeFilterCount > 0 && (
                                    <button onClick={(e) => { e.stopPropagation(); resetAllFilters(); }}
                                        className="flex items-center gap-1 text-xs text-rose-500 font-medium px-2 py-1 rounded-lg hover:bg-rose-50">
                                        <RotateCcw size={11} /> Reset
                                    </button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); setSheetState("collapsed"); }}
                                    className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
                                    <X size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Konten scrollable saat expand */}
                {sheetState !== "collapsed" && (
                    <div className="flex-1 overflow-y-auto sidebar-scroll px-4 pb-6 space-y-3">
                        {/* Stats */}
                        <StatsRow
                            filteredObjek={filteredObjek}
                            totalObjek={totalObjek}
                            hasAnyFilter={activeFilterCount > 0}
                            onResetFilters={resetAllFilters}
                        />

                        <LayerControl
                            jenisList={jenisList}
                            activeJenisIds={activeJenisIds}
                            onToggleJenis={onToggleJenis}
                            showKBAK={showKBAK}
                            onToggleKBAK={onToggleKBAK}
                            objekCount={objekCount}
                        />

                        {totalObjek > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <SlidersHorizontal size={14} className="text-emerald-600" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter</span>
                                    {activeFilterCount > 0 && (
                                        <span className={`text-xs font-bold text-white ${ACCENT.bg} w-5 h-5 rounded-full flex items-center justify-center`}>
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </div>
                                <FilterPanel
                                    filters={attributeFilters}
                                    options={attributeOptions}
                                    toggleFilter={onToggleAttributeFilter}
                                />
                            </div>
                        )}

                        <p className="text-xs text-slate-400 text-center pb-2">
                            💡 Gunakan kotak pencarian di atas peta untuk cari objek atau lokasi
                        </p>
                    </div>
                )}
            </div>

            {/* ── Overlay gelap saat sheet full ─────────── */}
            {sheetState === "full" && (
                <div className="md:hidden fixed inset-0 bg-black/20 z-[999]"
                    onClick={() => setSheetState("half")} />
            )}

            {/* ── Floating User Button ───────────────────── */}
            <div className="absolute top-4 right-4 z-[1001]">
                <UserButton user={user} onLogin={() => navigate("/login")} />
            </div>
        </>
    );
};
