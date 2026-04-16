import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { Map, Layers, Database, Upload, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { jenisList } = useJenisObjek();
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, byJenis: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            // Total objek
            const { count: total } = await supabase.from("objek_spasial").select("*", { count: "exact", head: true });

            // Objek bulan ini
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const { count: thisMonth } = await supabase.from("objek_spasial").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString());

            // Per jenis
            const { data: byJenis } = await supabase.from("objek_spasial").select("jenis_id, jenis_objek(nama, warna, ikon)").order("jenis_id");

            // Hitung per jenis
            const counts = {};
            (byJenis || []).forEach((d) => {
                const key = d.jenis_id;
                if (!counts[key]) counts[key] = { ...d.jenis_objek, count: 0 };
                counts[key].count++;
            });

            setStats({ total: total || 0, thisMonth: thisMonth || 0, byJenis: Object.values(counts) });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: "Total Objek", value: stats.total, icon: Database, color: "bg-blue-50 text-blue-600" },
        { label: "Jenis Objek", value: jenisList.length, icon: Layers, color: "bg-purple-50 text-purple-600" },
        { label: "Ditambah Bulan Ini", value: stats.thisMonth, icon: TrendingUp, color: "bg-green-50 text-green-600" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-sm text-slate-400 mt-0.5">Ringkasan data SIG KBAK Indonesia</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statCards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                            <Icon size={22} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">{label}</p>
                            <p className="text-2xl font-bold text-slate-800">{loading ? "..." : value.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Breakdown per jenis */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Distribusi per Jenis Objek</h2>
                {loading ? (
                    <p className="text-sm text-slate-400">Memuat...</p>
                ) : stats.byJenis.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-slate-400 text-sm">Belum ada data objek.</p>
                        <button onClick={() => navigate("/admin/upload")} className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
                            Upload Data Pertama
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stats.byJenis
                            .sort((a, b) => b.count - a.count)
                            .map((j) => {
                                const pct = stats.total > 0 ? (j.count / stats.total) * 100 : 0;
                                return (
                                    <div key={j.nama}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-slate-700">
                                                {j.ikon} {j.nama}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-800">{j.count.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: j.warna }} />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => navigate("/admin/upload")} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-slate-300 transition-all text-left">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Upload size={22} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Upload Data</p>
                        <p className="text-xs text-slate-400 mt-0.5">Import Shapefile atau Excel</p>
                    </div>
                </button>
                <button onClick={() => navigate("/admin/jenis")} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-slate-300 transition-all text-left">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Layers size={22} className="text-purple-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Kelola Jenis Objek</p>
                        <p className="text-xs text-slate-400 mt-0.5">Atur warna & ikon per jenis</p>
                    </div>
                </button>
            </div>
        </div>
    );
};
