import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Map, LayoutDashboard, Upload, Table2, Layers, Download, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/upload", icon: Upload, label: "Upload Data" },
    { to: "/admin/data", icon: Table2, label: "Kelola Data" },
    { to: "/admin/jenis", icon: Layers, label: "Jenis Objek" },
    { to: "/admin/export", icon: Download, label: "Export Data" },
];

export const AdminLayout = () => {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (!loading && !user) navigate("/login");
    }, [user, loading, navigate]);

    if (loading)
        return (
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
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-white text-slate-900" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                        >
                            <Icon size={17} className="flex-shrink-0" />
                            {!collapsed && <span className="truncate">{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-2 py-4 border-t border-slate-700 space-y-1">
                    <NavLink to="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                        <Map size={17} className="flex-shrink-0" />
                        {!collapsed && <span>Lihat Peta Publik</span>}
                    </NavLink>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-rose-900 hover:text-rose-300 transition-all">
                        <LogOut size={17} className="flex-shrink-0" />
                        {!collapsed && <span>Keluar</span>}
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
                    <button onClick={() => setCollapsed((p) => !p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
                        {collapsed ? <Menu size={16} /> : <X size={16} />}
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-medium text-slate-700">{user.email}</p>
                            <p className="text-xs text-slate-400">Editor</p>
                        </div>
                        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold">{user.email?.[0]?.toUpperCase()}</div>
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
