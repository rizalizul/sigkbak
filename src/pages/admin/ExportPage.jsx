import { useState, useEffect } from "react";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { supabase } from "../../lib/supabase";
import * as XLSX from "xlsx";
import { Download, Loader2, FileSpreadsheet, FileJson, FileText, Archive, MapPin } from "lucide-react";

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
    
    // STATE BARU UNTUK FILTER WILAYAH
    const [availableProvinsi, setAvailableProvinsi] = useState([]);
    const [availableKabupaten, setAvailableKabupaten] = useState([]);
    const [selectedProvinsi, setSelectedProvinsi] = useState("");
    const [selectedKabupaten, setSelectedKabupaten] = useState("");
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);

    const [exporting, setExporting] = useState(null);
    const [error, setError] = useState(null);

    // Mengambil daftar unik Provinsi dan Kabupaten dari database saat halaman dimuat
    useEffect(() => {
        const loadWilayahOptions = async () => {
            setIsLoadingFilters(true);
            const { data } = await supabase.from("objek_spasial").select("atribut");
            
            const provSet = new Set();
            const kabSet = new Set();

            (data || []).forEach(d => {
                const prov = d.atribut?.Provinsi || d.atribut?.provinsi || d.atribut?.PROVINSI || d.atribut?.Prov || d.atribut?.prov;
                const kab = d.atribut?.Kab_Kota || d.atribut?.Kabupaten || d.atribut?.kabupaten || d.atribut?.KABUPATEN || 
                            d.atribut?.Kota || d.atribut?.kota || d.atribut?.KOTA || 
                            d.atribut?.KAB_KOTA || d.atribut?.kab_kota || d.atribut?.KABKOT;

                if (prov) provSet.add(String(prov).toUpperCase().trim());
                if (kab) kabSet.add(String(kab).toUpperCase().trim());
            });

            // Urutkan sesuai abjad
            setAvailableProvinsi(Array.from(provSet).sort());
            setAvailableKabupaten(Array.from(kabSet).sort());
            setIsLoadingFilters(false);
        };
        loadWilayahOptions();
    }, []);

    // Fungsi fetchData di-update untuk menerapkan filter wilayah
    const fetchData = async () => {
        const ids = selectedJenis.length > 0 ? selectedJenis : jenisList.map((j) => j.id);
        if (ids.length === 0) throw new Error("Tidak ada jenis objek yang dipilih.");
        
        // 1. Ambil data berdasarkan Jenis Objek
        const { data, error: err } = await supabase.from("objek_spasial").select("*, jenis_objek(nama, warna, ikon)").in("jenis_id", ids);
        if (err) throw err;
        
        let filteredData = data || [];

        // 2. Filter berdasarkan Provinsi (jika dipilih)
        if (selectedProvinsi) {
            filteredData = filteredData.filter(d => {
                const prov = d.atribut?.Provinsi || d.atribut?.provinsi || d.atribut?.PROVINSI || d.atribut?.Prov || d.atribut?.prov;
                return prov && String(prov).toUpperCase().trim() === selectedProvinsi;
            });
        }

        // 3. Filter berdasarkan Kabupaten/Kota (jika dipilih)
        if (selectedKabupaten) {
            filteredData = filteredData.filter(d => {
                const kab = d.atribut?.Kab_Kota || d.atribut?.Kabupaten || d.atribut?.kabupaten || d.atribut?.KABUPATEN || 
                            d.atribut?.Kota || d.atribut?.kota || d.atribut?.KOTA || 
                            d.atribut?.KAB_KOTA || d.atribut?.kab_kota || d.atribut?.KABKOT;
                return kab && String(kab).toUpperCase().trim() === selectedKabupaten;
            });
        }

        if (filteredData.length === 0) {
            throw new Error("Tidak ada data yang sesuai dengan kombinasi filter wilayah dan jenis objek tersebut.");
        }

        return filteredData;
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
                            id: String(r.id),
                            nama: r.nama_objek || "Tanpa Nama", 
                            jenis: r.jenis_objek?.nama || "", 
                            ...r.atribut 
                        },
                    })),
            };

            const shpwrite = await import("@mapbox/shp-write");
            const zipContent = await shpwrite.zip(geojson, {
                folder: 'sigkbak_shapefile',
                types: { point: 'sigkbak_points' }
            });

            let blob;
            if (typeof zipContent === "string") {
                const byteCharacters = atob(zipContent);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                blob = new Blob([byteArray], { type: "application/zip" });
            } else {
                blob = new Blob([zipContent], { type: "application/zip" });
            }
            
            const a = document.createElement("a");
            const url = URL.createObjectURL(blob);
            a.href = url;
            a.download = `sigkbak_shapefile_${Date.now()}.zip`;
            document.body.appendChild(a); 
            a.click();
            document.body.removeChild(a); 
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Error shapefile:", err);
            setError(err.message || "Gagal mengexport Shapefile. Pastikan data tidak kosong.");
        }
        setExporting(null);
    };

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
                <p className="text-sm text-slate-400 mt-0.5">Download data objek dalam berbagai format dan filter</p>
            </div>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bagian 1: Filter Jenis Objek */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full">
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                        Filter Jenis Objek <span className="text-slate-400 font-normal">(kosong = semua)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {jenisList.map((j) => {
                            const active = selectedJenis.includes(j.id);
                            const isImage = j.ikon?.startsWith("http") || j.ikon?.includes("/");
                            
                            return (
                                <button
                                    key={j.id}
                                    onClick={() => setSelectedJenis((p) => (active ? p.filter((x) => x !== j.id) : [...p, j.id]))}
                                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border font-medium transition-all ${active ? "text-slate-800 border-slate-400 bg-slate-100 shadow-inner" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                                >
                                    {isImage ? (
                                        <img src={j.ikon} alt="ikon" className="w-4 h-4 object-contain" />
                                    ) : (
                                        <span>{j.ikon}</span>
                                    )}
                                    {j.nama}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bagian 2: Filter Wilayah (Baru) */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin size={16} className="text-blue-500" />
                        <p className="text-sm font-semibold text-slate-700">
                            Filter Wilayah <span className="text-slate-400 font-normal">(kosong = semua daerah)</span>
                        </p>
                    </div>
                    
                    {isLoadingFilters ? (
                        <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                            <Loader2 size={16} className="animate-spin" /> Memuat daftar wilayah...
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Berdasarkan Provinsi</label>
                                <select 
                                    value={selectedProvinsi} 
                                    onChange={(e) => setSelectedProvinsi(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <option value="">Semua Provinsi</option>
                                    {availableProvinsi.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Berdasarkan Kabupaten / Kota</label>
                                <select 
                                    value={selectedKabupaten} 
                                    onChange={(e) => setSelectedKabupaten(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <option value="">Semua Kabupaten / Kota</option>
                                    {availableKabupaten.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end pt-1">
                                {(selectedProvinsi || selectedKabupaten) && (
                                    <button 
                                        onClick={() => { setSelectedProvinsi(""); setSelectedKabupaten(""); }}
                                        className="text-xs font-medium text-rose-500 hover:text-rose-700 transition-colors"
                                    >
                                        Reset Wilayah
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Format cards */}
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
