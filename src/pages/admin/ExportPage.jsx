import { useState } from "react";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { supabase } from "../../lib/supabase";
import * as XLSX from "xlsx";
import { Download, Loader2, FileSpreadsheet, FileJson, FileText, Archive } from "lucide-react";

const flattenObjek = (rows) =>
    rows.map((r) => ({
        id: r.id,
        jenis_objek: r.jenis_objek?.nama || "",
        nama_objek: r.nama_objek || "",
        koordinat_x: r.koordinat_x,
        koordinat_y: r.koordinat_y,
        ...r.atribut,
        created_at: r.created_at,
    }));

export const ExportPage = () => {
    const { jenisList } = useJenisObjek();
    const [selectedJenis, setSelectedJenis] = useState([]);
    const [exporting, setExporting] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        const ids = selectedJenis.length > 0 ? selectedJenis : jenisList.map((j) => j.id);
        if (ids.length === 0) return [];
        const { data, error: err } = await supabase.from("objek_spasial").select("*, jenis_objek(nama, warna, ikon)").in("jenis_id", ids);
        if (err) throw err;
        return data || [];
    };

    const exportExcel = async () => {
        setExporting("xlsx");
        setError(null);
        try {
            const rows = await fetchData();
            const flat = flattenObjek(rows);
            const ws = XLSX.utils.json_to_sheet(flat);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Objek KBAK");
            XLSX.writeFile(wb, `sigkbak_export_${Date.now()}.xlsx`);
        } catch (err) {
            setError(err.message);
        }
        setExporting(null);
    };

    const exportGeoJSON = async () => {
        setExporting("geojson");
        setError(null);
        try {
            const rows = await fetchData();
            const geojson = {
                type: "FeatureCollection",
                features: rows
                    .filter((r) => r.koordinat_x && r.koordinat_y)
                    .map((r) => ({
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [r.koordinat_x, r.koordinat_y] },
                        properties: { id: r.id, nama_objek: r.nama_objek, jenis: r.jenis_objek?.nama, ...r.atribut },
                    })),
            };
            const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `sigkbak_export_${Date.now()}.geojson`;
            a.click();
        } catch (err) {
            setError(err.message);
        }
        setExporting(null);
    };

    const exportCSV = async () => {
        setExporting("csv");
        setError(null);
        try {
            const rows = await fetchData();
            const flat = flattenObjek(rows);
            const ws = XLSX.utils.json_to_sheet(flat);
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: "text/csv" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `sigkbak_export_${Date.now()}.csv`;
            a.click();
        } catch (err) {
            setError(err.message);
        }
        setExporting(null);
    };

    // 🌟 FUNGSI BARU: Export ke Shapefile (.zip)
    const exportShapefile = async () => {
        setExporting("shp");
        setError(null);
        try {
            const rows = await fetchData();
            const geojson = {
                type: "FeatureCollection",
                features: rows
                    .filter((r) => r.koordinat_x && r.koordinat_y)
                    .map((r) => ({
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [r.koordinat_x, r.koordinat_y] },
                        properties: { 
                            id: String(r.id), // Pastikan ID jadi string agar aman di DBF
                            nama: r.nama_objek || "Tanpa Nama", 
                            jenis: r.jenis_objek?.nama || "", 
                            ...r.atribut 
                        },
                    })),
            };

            // Dynamic import agar halaman tidak berat saat dimuat pertama kali
            const shpwrite = await import("@mapbox/shp-write");
            
            // shp-write akan otomatis mendownload file .zip berisi SHP, DBF, SHX, PRJ
            shpwrite.download(geojson, {
                folder: 'sigkbak_shapefile',
                types: { point: 'sigkbak_points' }
            });

        } catch (err) {
            console.error(err);
            setError("Gagal mengexport Shapefile. Pastikan data tidak kosong.");
        }
        setExporting(null);
    };

    // 🌟 Tambahkan Shapefile ke dalam daftar format
    const exportFormats = [
        { key: "xlsx", label: "Excel (.xlsx)", desc: "Tabel lengkap dengan semua atribut", icon: FileSpreadsheet, color: "text-green-600 bg-green-50", action: exportExcel },
        { key: "shp", label: "Shapefile (.shp)", desc: "Format GIS (dikompres dalam .zip)", icon: Archive, color: "text-purple-600 bg-purple-50", action: exportShapefile },
        { key: "geojson", label: "GeoJSON", desc: "Format standar GIS dengan geometri", icon: FileJson, color: "text-blue-600 bg-blue-50", action: exportGeoJSON },
        { key: "csv", label: "CSV", desc: "Tabel sederhana tanpa format", icon: FileText, color: "text-amber-600 bg-amber-50", action: exportCSV },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Export Data</h1>
                <p className="text-sm text-slate-400 mt-0.5">Download data objek dalam berbagai format</p>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}

            {/* Filter jenis */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-slate-700 mb-3">
                    Filter Jenis Objek <span className="text-slate-400 font-normal">(kosong = semua)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                    {jenisList.map((j) => {
                        const active = selectedJenis.includes(j.id);
                        return (
                            <button
                                key={j.id}
                                onClick={() => setSelectedJenis((p) => (active ? p.filter((x) => x !== j.id) : [...p, j.id]))}
                                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border font-medium transition-all ${active ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                                style={active ? { backgroundColor: j.warna } : {}}
                            >
                                {j.ikon} {j.nama}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Format cards - Diubah menjadi grid 4 kolom di layar besar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {exportFormats.map(({ key, label, desc, icon: Icon, color, action }) => (
                    <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                            <Icon size={24} />
                        </div>
                        <p className="font-semibold text-slate-800 mb-1">{label}</p>
                        <p className="text-xs text-slate-400 mb-4">{desc}</p>
                        <button
                            onClick={action}
                            disabled={!!exporting}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-60"
                        >
                            {exporting === key ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Mengexport...
                                </>
                            ) : (
                                <>
                                    <Download size={14} />
                                    Download
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
