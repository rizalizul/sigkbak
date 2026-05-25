import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { Map, Layers, Database, Upload, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; 
        
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-slate-100 p-3 rounded-xl shadow-lg">
                <div className="flex items-center gap-1.5 mb-1.5">
                    {data.ikon?.startsWith("http") || data.ikon?.includes("/") ? (
                        <img src={data.ikon} alt="ikon" className="w-4 h-4 object-contain" />
                    ) : (
                        <span className="text-[12px] leading-none">{data.ikon}</span>
                    )}
                    <p className="text-sm font-semibold text-slate-800">{data.nama}</p>
                </div>
                <p className="text-xs text-slate-500">
                    Jumlah: <span className="font-bold text-slate-800">{data.count}</span> objek
                </p>
            </div>
        );
    }
    return null;
};

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { jenisList } = useJenisObjek();
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, byJenis: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { count: total } = await supabase.from("objek_spasial").select("*", { count: "exact", head: true });

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const { count: thisMonth } = await supabase.from("objek_spasial").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString());

            const { data: byJenis } = await supabase.from("objek_spasial").select("jenis_id, jenis_objek(nama, warna, ikon)").order("jenis_id");

            const counts = {};
            (byJenis || []).forEach((d) => {
                const key = d.jenis_id;
                if (!counts[key]) counts[key] = { ...d.jenis_objek, count: 0 };
                counts[key].count++;
            });

            // 🌟 Persiapkan data untuk Pie Chart
            const chartData = Object.values(counts)
                .sort((a, b) => b.count - a.count)
                .map(j => ({
                    ...j,
                    // Jika warna transparan, paksa ke emerald agar chartnya kelihatan
                    chartColor: j.warna === "transparent" ? "#059669" : (j.warna || "#6b7280")
                }));

            setStats({ total: total || 0, thisMonth: thisMonth || 0, byJenis: chartData });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: "Total Objek", value: stats.total, icon: Database, color: "bg-blue-50 text-blue-600" },
        { label: "Jenis Objek", value: jenisList.length, icon: Layers, color: "bg-purple-50 text-purple-600" },
        { label: "Ditambah Bulan Ini", value: stats.thisMonth, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
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

            {/* 🌟 Area Analitik: Pie Chart & Progress Bar Bersebelahan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Kiri: Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
                    <h2 className="text-sm font-semibold text-slate-800 mb-2">Visualisasi Proporsi</h2>
                    <div className="flex-1 min-h-[250px] w-full flex items-center justify-center relative">
                        {loading ? (
                            <div className="w-40 h-40 rounded-full border-4 border-slate-100 border-t-slate-300 animate-spin" />
                        ) : stats.byJenis.length === 0 ? (
                            <p className="text-sm text-slate-400">Tidak ada data untuk ditampilkan</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.byJenis}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="nama"
                                        stroke="none"
                                    >
                                        {stats.byJenis.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.chartColor} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        {/* Teks di tengah Donut Chart */}
                        {!loading && stats.byJenis.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
                                <span className="text-[10px] uppercase tracking-wider text-slate-400">Total</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kanan: Breakdown Progress Bar */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-5">Distribusi per Jenis Objek</h2>
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i}>
                                    <div className="h-4 bg-slate-100 rounded w-1/4 mb-2"></div>
                                    <div className="h-2 bg-slate-100 rounded-full w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : stats.byJenis.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-400 text-sm">Belum ada data objek.</p>
                            <button onClick={() => navigate("/admin/upload")} className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
                                Upload Data Pertama
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {stats.byJenis.map((j) => {
                                const pct = stats.total > 0 ? (j.count / stats.total) * 100 : 0;
                                const isTransparent = j.warna === "transparent";

                                return (
                                    <div key={j.nama} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                                                    style={{
                                                        backgroundColor: isTransparent ? '#f8fafc' : `${j.chartColor}15`,
                                                        border: `1px solid ${isTransparent ? '#e2e8f0' : `${j.chartColor}30`}`
                                                    }}>
                                                    {j.ikon?.startsWith("http") || j.ikon?.includes("/") ? (
                                                        <img src={j.ikon} alt="ikon" className="w-4 h-4 object-contain" />
                                                    ) : (
                                                        <span className="text-[11px] leading-none">{j.ikon}</span>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                                    {j.nama}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-slate-800">{j.count.toLocaleString()}</span>
                                                <span className="text-xs text-slate-400 ml-1.5 font-medium w-10 inline-block text-right">({pct.toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700 ease-out" 
                                                style={{ width: `${pct}%`, backgroundColor: j.chartColor }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => navigate("/admin/upload")} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-slate-300 hover:shadow-md transition-all text-left group">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Upload size={22} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Upload Data</p>
                        <p className="text-xs text-slate-400 mt-0.5">Import Shapefile atau Excel</p>
                    </div>
                </button>
                <button onClick={() => navigate("/admin/jenis")} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-slate-300 hover:shadow-md transition-all text-left group">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-105 transition-transform">
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
