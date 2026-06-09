import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { Map, Layers, Database, Upload, TrendingUp, MapPin, Calendar, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, byJenis: [], byKabupaten: [], byProvinsi: [], byTahun: [] });
    const [loading, setLoading] = useState(true);
    
    // State untuk Tab Wilayah
    const [activeWilayahTab, setActiveWilayahTab] = useState("kabupaten");
    const [selectedWilayahDetail, setSelectedWilayahDetail] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            const { count: total } = await supabase.from("objek_spasial").select("*", { count: "exact", head: true });

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const { count: thisMonth } = await supabase.from("objek_spasial").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString());

            // Tambahkan 'id' dan 'nama_objek' di query agar bisa dipanggil di modal
            const { data: rawData } = await supabase.from("objek_spasial").select("id, nama_objek, jenis_id, jenis_objek(nama, warna, ikon), atribut, created_at");

            const counts = {};
            const kabupatenMap = {};
            const provinsiMap = {};
            const tahunMap = {};

            (rawData || []).forEach((d) => {
                // 1. Rekap Jenis Objek
                const key = d.jenis_id;
                if (!counts[key]) counts[key] = { ...d.jenis_objek, count: 0 };
                counts[key].count++;

                // 2. Rekap Wilayah Terpisah (Kabupaten/Kota & Provinsi)
                const prov = d.atribut?.Provinsi || d.atribut?.provinsi || d.atribut?.PROVINSI || d.atribut?.Prov || d.atribut?.prov;
                const kab = d.atribut?.Kab_Kota || d.atribut?.Kabupaten || d.atribut?.kabupaten || d.atribut?.KABUPATEN || 
                            d.atribut?.Kota || d.atribut?.kota || d.atribut?.KOTA || 
                            d.atribut?.KAB_KOTA || d.atribut?.kab_kota || d.atribut?.KABKOT;

                const provKey = prov ? String(prov).toUpperCase().trim() : "BELUM DIISI";
                const kabKey = kab ? String(kab).toUpperCase().trim() : "BELUM DIISI";

                // Masukkan seluruh data objek ke dalam array 'objects' untuk ditampilkan di modal nanti
                if (provKey !== "BELUM DIISI" || kabKey === "BELUM DIISI") {
                    if (!provinsiMap[provKey]) provinsiMap[provKey] = { count: 0, objects: [] };
                    provinsiMap[provKey].count++;
                    provinsiMap[provKey].objects.push(d);
                }

                if (kabKey !== "BELUM DIISI" || provKey === "BELUM DIISI") {
                    if (!kabupatenMap[kabKey]) kabupatenMap[kabKey] = { count: 0, objects: [] };
                    kabupatenMap[kabKey].count++;
                    kabupatenMap[kabKey].objects.push(d);
                }

                // 3. Rekap Tahun Pemetaan
                let tahunKey = d.atribut?.Tahun || d.atribut?.tahun || d.atribut?.TAHUN;
                if (!tahunKey || String(tahunKey).trim() === "") {
                    tahunKey = "Tidak Diketahui"; 
                } else {
                    tahunKey = String(tahunKey).trim();
                }

                if (!tahunMap[tahunKey]) tahunMap[tahunKey] = 0;
                tahunMap[tahunKey]++;
            });

            // Format data untuk Chart & Sorting dari jumlah terbanyak
            const chartData = Object.values(counts)
                .sort((a, b) => b.count - a.count)
                .map(j => ({
                    ...j,
                    chartColor: j.warna === "transparent" ? "#059669" : (j.warna || "#6b7280")
                }));

            // Mapping ulang data wilayah yang kini berisi daftar objects
            const kabupatenData = Object.entries(kabupatenMap)
                .map(([name, data]) => ({ name, count: data.count, objects: data.objects }))
                .sort((a, b) => b.count - a.count);

            const provinsiData = Object.entries(provinsiMap)
                .map(([name, data]) => ({ name, count: data.count, objects: data.objects }))
                .sort((a, b) => b.count - a.count);

            const tahunData = Object.entries(tahunMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => {
                    if (a.name === "Tidak Diketahui") return 1;
                    if (b.name === "Tidak Diketahui") return -1;
                    return a.name.localeCompare(b.name);
                });

            setStats({ 
                total: total || 0, 
                thisMonth: thisMonth || 0, 
                byJenis: chartData,
                byKabupaten: kabupatenData,
                byProvinsi: provinsiData,
                byTahun: tahunData
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: "Total Objek", value: stats.total, icon: Database, color: "bg-blue-50 text-blue-600" },
        { label: "Jenis Objek", value: jenisList.length, icon: Layers, color: "bg-purple-50 text-purple-600" },
        { label: "Ditambah Bulan Ini", value: stats.thisMonth, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    ];

    const wilayahDataRender = activeWilayahTab === "kabupaten" ? stats.byKabupaten : stats.byProvinsi;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-sm text-slate-400 mt-0.5">Ringkasan analitik data SIG KBAK Indonesia</p>
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

            {/* Area Analitik 1: Jenis Objek */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Kiri: Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
                    <h2 className="text-sm font-semibold text-slate-800 mb-2">Visualisasi Proporsi</h2>
                    <div className="flex-1 min-h-[250px] w-full flex items-center justify-center relative">
                        {loading ? (
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
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

            {/* Area Analitik 2: Wilayah & Waktu (Cakupan Survei) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Distribusi Wilayah */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-blue-500" />
                            <h2 className="text-sm font-semibold text-slate-800">Cakupan Wilayah Survei</h2>
                        </div>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 self-start sm:self-auto">
                            <button 
                                onClick={() => setActiveWilayahTab("kabupaten")} 
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${activeWilayahTab === "kabupaten" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                            >
                                Kabupaten/Kota
                            </button>
                            <button 
                                onClick={() => setActiveWilayahTab("provinsi")} 
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${activeWilayahTab === "provinsi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                            >
                                Provinsi
                            </button>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-6 bg-slate-100 rounded w-full"></div>)}
                        </div>
                    ) : wilayahDataRender.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">Belum ada cakupan wilayah.</p>
                    ) : (
                        <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {wilayahDataRender.map((w, i) => {
                                const pct = stats.total > 0 ? (w.count / stats.total) * 100 : 0;
                                return (
                                    // Modifikasi agar list wilayah bisa diklik
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedWilayahDetail(w)}
                                        className="cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors border border-transparent hover:border-slate-100 group"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-medium text-slate-700 truncate pr-4 group-hover:text-blue-600 transition-colors" title={w.name}>
                                                <span className="text-slate-400 font-normal mr-1">{i + 1}.</span> {w.name}
                                            </span>
                                            <span className="text-sm font-bold text-slate-800">
                                                {w.count.toLocaleString()} <span className="text-xs text-slate-400 font-normal ml-1">objek</span>
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Distribusi Waktu (Tahun) */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                        <Calendar size={18} className="text-orange-500" />
                        <h2 className="text-sm font-semibold text-slate-800">Tren Tahun Pemetaan</h2>
                    </div>
                    <div className="flex-1 min-h-[250px] w-full relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin" />
                            </div>
                        ) : stats.byTahun.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-sm text-slate-400">Belum ada data tahun.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.byTahun} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white/95 backdrop-blur-sm border border-slate-100 p-2.5 rounded-xl shadow-lg">
                                                        <p className="text-xs font-semibold text-slate-800 mb-1">Tahun {payload[0].payload.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            Pemetaan: <span className="font-bold text-orange-600">{payload[0].value}</span> objek
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
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

            {/* MODAL POPUP: Menampilkan Daftar Objek di Wilayah Tertentu */}
            {selectedWilayahDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">
                                    <MapPin size={18} className="inline-block text-blue-500 mr-1.5 -mt-0.5" />
                                    {selectedWilayahDetail.name}
                                </h3>
                                <p className="text-xs font-medium text-slate-500 mt-0.5 ml-6">
                                    Menampilkan {selectedWilayahDetail.count} objek spasial
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedWilayahDetail(null)} 
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        {/* Isi List Objek */}
                        <div className="p-3 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-1">
                                {selectedWilayahDetail.objects.map(obj => (
                                    <div key={obj.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-colors group">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 bg-white border border-slate-200 shadow-sm"
                                            style={{ borderColor: obj.jenis_objek?.warna === 'transparent' ? '#e2e8f0' : (obj.jenis_objek?.warna || '#e2e8f0') }}>
                                            {obj.jenis_objek?.ikon && (obj.jenis_objek.ikon.startsWith('http') || obj.jenis_objek.ikon.includes('/')) ? (
                                                <img src={obj.jenis_objek.ikon} alt="ikon" className="w-6 h-6 object-contain" />
                                            ) : (
                                                <span className="text-[16px] leading-none">{obj.jenis_objek?.ikon || "📍"}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{obj.nama_objek || "Tanpa Nama"}</p>
                                            <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                                                {obj.jenis_objek?.nama || "Jenis Tidak Diketahui"}
                                            </p>
                                        </div>
                                        {/* Tombol pintasan langsung ke form edit */}
                                        <button 
                                            onClick={() => navigate(`/admin/data?edit=${obj.id}`)}
                                            className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3.5 py-2 rounded-lg whitespace-nowrap transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        >
                                            Buka & Edit
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
