import { useEffect, useState, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Map, LayoutDashboard, Upload, Table2, Layers, Download, LogOut, Menu, X, ClipboardList, Users, ChevronDown } from "lucide-react";

const navItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/upload",    icon: Upload,          label: "Upload Data" },
    { to: "/admin/data",      icon: Table2,          label: "Kelola Data" },
    { to: "/admin/jenis",     icon: Layers,          label: "Jenis Objek" },
    { to: "/admin/export",    icon: Download,        label: "Export Data" },
    { to: "/admin/audit",     icon: ClipboardList,   label: "Riwayat Aktivitas" },
    { to: "/admin/users",     icon: Users,           label: "Manajemen User" },
];

export const AdminLayout = () => {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed,    setCollapsed]    = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!loading && !user) navigate("/login");
    }, [user, loading, navigate]);

    // Tutup dropdown saat klik luar
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 bg-slate-900 rounded-xl animate-pulse flex items-center justify-center">
                <Map size={18} className="text-white" />
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside className={`flex flex-col bg-slate-900 text-white transition-all duration-300 flex-shrink-0 ${collapsed ? "w-16" : "w-56"}`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                        <Map size={16} className="text-slate-900" />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="text-sm font-bold leading-none truncate">SIG KBAK</p>
                            <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto sidebar-scroll">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-white text-slate-900" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`
                            }>
                            <Icon size={17} className="flex-shrink-0" />
                            {!collapsed && <span className="truncate">{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Link peta publik di bawah sidebar */}
                <div className="px-2 py-4 border-t border-slate-700">
                    <NavLink to="/" target="_blank"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                        <Map size={17} className="flex-shrink-0" />
                        {!collapsed && <span>Lihat Peta Publik</span>}
                    </NavLink>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
                    {/* Toggle sidebar */}
                    <button onClick={() => setCollapsed((p) => !p)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
                        {collapsed ? <Menu size={16} /> : <X size={16} />}
                    </button>

                    {/* Avatar dropdown */}
                    <div ref={dropdownRef} className="relative">
                        <button onClick={() => setShowDropdown((p) => !p)}
                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {user.email?.[0]?.toUpperCase()}
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-xs font-semibold text-slate-700 max-w-[160px] truncate">{user.email}</p>
                                <p className="text-xs text-slate-400">Editor</p>
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                    <p className="text-xs font-semibold text-slate-700 truncate">{user.email}</p>
                                    <p className="text-xs text-slate-400">Editor</p>
                                </div>
                                <NavLink to="/" target="_blank"
                                    onClick={() => setShowDropdown(false)}
                                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                    <Map size={15} />
                                    Lihat Peta Publik
                                </NavLink>
                                <button onClick={() => { setShowDropdown(false); logout(); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100">
                                    <LogOut size={15} />
                                    Keluar
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
