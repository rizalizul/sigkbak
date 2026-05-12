import { useState, useRef, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Map, LogIn, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { LayerControl } from "./LayerControl";
import { useNavigate }  from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { FilterPanel } from "./FilterPanel";

export const PublicSidebar = ({
    jenisList, activeJenisIds, onToggleJenis,
    showKBAK, onToggleKBAK,
    searchQuery, onSearch,
    totalObjek, filteredObjek, objekCount,
    user, attributeFilters, attributeOptions, onToggleAttributeFilter
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const { logout } = useAuth();

    const handleLogout = async () => {
        if (user) {
            await supabase.from("audit_log").insert({
                user_id: user.id,
                user_email: user.email,
                action: "LOGOUT",
                table_name: "Sistem Autentikasi",
                record_name: "Logout dari Peta Publik"
            });
        }
        setShowDropdown(false);
        logout();
    };

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <>
            <button onClick={() => setCollapsed((p) => !p)}
                className="absolute top-1/2 -translate-y-1/2 z-[1001] w-6 h-12 bg-white shadow-lg border border-slate-100 rounded-r-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                style={{ left: collapsed ? "0px" : "300px" }}>
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={`absolute left-0 top-0 h-full z-[1000] bg-white/97 backdrop-blur-xl shadow-2xl border-r border-slate-100 flex flex-col transition-all duration-300 ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
                style={{ width: "300px" }}>

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

                {/* Search nama objek */}
                <div className="px-4 pt-4 pb-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Cari nama objek..."
                            value={searchQuery} onChange={(e) => onSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 px-1">
                        💡 Untuk cari lokasi di peta, gunakan kotak pencarian di tengah atas peta
                    </p>
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
                    <LayerControl
                        jenisList={jenisList}
                        activeJenisIds={activeJenisIds}
                        onToggleJenis={onToggleJenis}
                        showKBAK={showKBAK}
                        onToggleKBAK={onToggleKBAK}
                        objekCount={objekCount}
                    />
                    
                    <FilterPanel 
                        filters={attributeFilters} 
                        options={attributeOptions} 
                        toggleFilter={onToggleAttributeFilter} 
                    />
                </div>

                
            </div>
            {/* Floating User Menu (Kanan Atas) */}
            <div className="absolute top-4 right-4 z-[1001]">
                {user ? (
                    <div ref={dropdownRef} className="relative">
                        {/* Tombol Profil (Avatar Bulat) */}
                        <button 
                            onClick={() => setShowDropdown((p) => !p)}
                            className="group relative flex items-center justify-center w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-slate-200 hover:bg-slate-50 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-inner">
                                {user.email?.[0]?.toUpperCase() || "U"}
                            </div>

                            {/* Tooltip Hover*/}
                            <div className="absolute top-12 right-0 hidden group-hover:flex flex-col bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                                <span className="font-semibold">{user.user_metadata?.full_name || "Admin KBAK"}</span>
                                <span className="text-slate-300">{user.email}</span>
                            </div>
                        </button>

                        {/* Isi Dropdown (Mirip AdminLayout) */}
                        {showDropdown && (
                            <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Header Dropdown (Info User) */}
                                <div className="px-4 py-5 border-b border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center">
                                    <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 shadow-sm ring-4 ring-blue-100">
                                        {user.email?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 truncate w-full">
                                        {user.user_metadata?.full_name || "Admin KBAK"}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate w-full mt-0.5">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Menu Actions */}
                                <div className="p-2">
                                    <button onClick={() => navigate("/admin/dashboard")}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium">
                                        <LayoutDashboard size={16} className="text-slate-400" /> 
                                        Buka Admin Panel
                                    </button>
                                </div>

                                <div className="p-2 border-t border-slate-100">
                                    <button onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium">
                                        <LogOut size={16} className="text-rose-500" /> 
                                        Keluar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Tombol Login Publik */
                    <button onClick={() => navigate("/login")}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-sm text-slate-700 rounded-full shadow-md border border-slate-200 font-medium hover:bg-slate-50 hover:shadow-lg transition-all text-sm">
                        <LogIn size={15} className="text-slate-500" /> Login
                    </button>
                )}
            </div>
        </>
    );
};
