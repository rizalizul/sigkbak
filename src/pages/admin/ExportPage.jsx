import { useState, useEffect } from "react";
import { useJenisObjek } from "../../hooks/useJenisObjek";
import { supabase } from "../../lib/supabase";
import * as XLSX from "xlsx";
import { Download, Loader2, FileSpreadsheet, FileJson, FileText, Archive, MapPin } from "lucide-react";

const flattenObjek = (rows) =>
    rows.map((r) => {
        const attr = r.atribut || {};
        
        const base = {
            "Jenis_Objek": r.jenis_objek?.nama || "", 
            "Kode": attr.Kode || attr.kode || "",
            "Nama Objek": r.nama_objek || "",
            "X": r.koordinat_x ?? "",
            "Y": r.koordinat_y ?? "",
            "Jenis": attr.Jenis || attr.jenis || "",
            "Desa": attr.Desa || attr.desa || "",
            "Kecamatan": attr.Kecamatan || attr.kecamatan || "",
            "Kab_Kota": attr.Kab_Kota || attr.kab_kota || attr.Kabupaten || attr.kabupaten || attr.Kota || attr.kota || "",
            "Provinsi": attr.Provinsi || attr.provinsi || "",
            "Deskripsi_Objek": attr.Deskripsi_Objek || attr.deskripsi_objek || attr.Deskripsi || attr.deskripsi || "",
            "Sumber": attr.Sumber || attr.sumber || "",
            "Tahun": attr.Tahun || attr.tahun || "",
            "Status": attr.Status || attr.status || "",
            "Foto": attr.Foto || attr.foto || attr.foto_url || "",
        };

        const mappedKeys = [
            "Kode", "kode", "Jenis", "jenis", "Desa", "desa", "Kecamatan", "kecamatan", 
            "Kab_Kota", "kab_kota", "Kabupaten", "kabupaten", "Kota", "kota", 
            "Provinsi", "provinsi", "Deskripsi_Objek", "deskripsi_objek", 
            "Deskripsi", "deskripsi", "Sumber", "sumber", "Tahun", "tahun", 
            "Status", "status", "Foto", "foto", "foto_url"
        ];

        const extras = {};
        Object.keys(attr).forEach((k) => {
            if (!mappedKeys.includes(k)) {
                extras[k] = attr[k];
            }
        });

        return { ...base, ...extras };
    });

export const ExportPage = () => {
    const { jenisList } = useJenisObjek();
    const [selectedJenis, setSelectedJenis] = useState([]);
    
    // STATE UNTUK FILTER WILAYAH
    const [availableProvinsi, setAvailableProvinsi] = useState([]);
    const [availableKabupaten, setAvailableKabupaten] = useState([]);
    const [selectedProvinsi, setSelectedProvinsi] = useState("");
    const [selectedKabupaten, setSelectedKabupaten] = useState("");
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);

    const [exporting, setExporting] = useState(null);
    const [error, setError] = useState(null);

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

            setAvailableProvinsi(Array.from(provSet).sort());
            setAvailableKabupaten(Array.from(kabSet).sort());
            setIsLoadingFilters(false);
        };
        loadWilayahOptions();
    }, []);

    const fetchData = async () => {
        const ids = selectedJenis.length > 0 ? selectedJenis : jenisList.map((j) => j.id);
        if (ids.length === 0) throw new Error("Tidak ada jenis objek yang dipilih.");
        
        const { data, error: err } = await supabase.from("objek_spasial").select("*, jenis_objek(nama, warna, ikon)").in("jenis_id", ids);
        if (err) throw err;
        
        let filteredData = data || [];

        if (selectedProvinsi) {
            filteredData = filteredData.filter(d => {
                const prov = d.atribut?.Provinsi || d.atribut?.provinsi || d.atribut?.PROVINSI || d.atribut?.Prov || d.atribut?.prov;
                return prov && String(prov).toUpperCase().trim() === selectedProvinsi;
            });
        }

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

    const getBaseName = () => {
        let parts = ["SIG_KBAK"];
        
        // Penamaan berdasarkan Jenis Objek
        if (selectedJenis.length === 1) {
            const jName = jenisList.find(j => j.id === selectedJenis[0])?.nama;
            if (jName) parts.push(jName);
        } else if (selectedJenis.length > 1) {
            parts.push("Multi_Objek");
        } else {
            parts.push("Semua_Objek");
        }

        // Penamaan berdasarkan Wilayah
        if (selectedProvinsi) parts.push(selectedProvinsi);
        if (selectedKabupaten) parts.push(selectedKabupaten);

        // Penamaan berdasarkan Waktu (YYYYMMDD_HHMMSS)
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        
        parts.push(`${yyyy}${mm}${dd}_${hh}${min}${ss}`);

        // Gabung dengan underscore, bersihkan karakter aneh
        return parts.join("_").replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
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
            XLSX.writeFile(wb, `${getBaseName()}.xlsx`);
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
            const flatData = flattenObjek(rows);
            
            const geojson = {
                type: "FeatureCollection",
                features: flatData
                    .filter((r) => r.X !== "" && r.Y !== "") 
                    .map((r) => ({
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [Number(r.X), Number(r.Y)] },
                        properties: r, 
                    })),
            };
            
            const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${getBaseName()}.geojson`;
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
            a.download = `${getBaseName()}.csv`;
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
            const flatData = flattenObjek(rows);

            const geojson = {
                type: "FeatureCollection",
                features: flatData
                    .filter((r) => r.X !== "" && r.Y !== "")
                    .map((r) => {
                        // Cetak objek baru dari awal agar urutan tidak melompat ke belakang
                        const shpProps = {
                            "Jns_Objek": r["Jenis_Objek"] || "",
                            "Kode": r["Kode"] || "",
                            "Nama Objek": r["Nama Objek"] || "",
                            "X": r["X"],
                            "Y": r["Y"],
                            "Jenis": r["Jenis"] || "",
                            "Desa": r["Desa"] || "",
                            "Kecamatan": r["Kecamatan"] || "",
                            "Kab_Kota": r["Kab_Kota"] || "",
                            "Provinsi": r["Provinsi"] || "",
                            "Deskripsi_Objek": r["Deskripsi_Objek"] || "",
                            "Sumber": r["Sumber"] || "",
                            "Tahun": r["Tahun"] || "",
                            "Status": r["Status"] || "",
                            "Foto": r["Foto"] || "",
                        };
                        
                        // Masukkan atribut tambahan (extras) jika ada di urutan paling akhir
                        const standardKeys = ["Jenis_Objek", "Kode", "Nama Objek", "X", "Y", "Jenis", "Desa", "Kecamatan", "Kab_Kota", "Provinsi", "Deskripsi_Objek", "Sumber", "Tahun", "Status", "Foto"];
                        Object.keys(r).forEach(k => {
                            if (!standardKeys.includes(k)) {
                                shpProps[k] = r[k];
                            }
                        });

                        return {
                            type: "Feature",
                            geometry: { type: "Point", coordinates: [Number(r.X), Number(r.Y)] },
                            properties: shpProps, 
                        };
                    }),
            };

            const baseName = getBaseName(); 
            const shpwrite = await import("@mapbox/shp-write");
            
            const zipContent = await shpwrite.zip(geojson, {
                folder: baseName, 
                types: { point: baseName } 
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
            a.download = `${baseName}.zip`; 
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
        { key: "xlsx", label: "Excel (.xlsx)", desc: "Tabel lengkap dengan semua atribut baku", icon: FileSpreadsheet, color: "text-green-600 bg-green-50", action: exportExcel },
        { key: "shp", label: "Shapefile (.shp)", desc: "Format GIS (dikompres dalam .zip)", icon: Archive, color: "text-purple-600 bg-purple-50", action: exportShapefile },
        { key: "geojson", label: "GeoJSON", desc: "Format standar web GIS dengan geometri", icon: FileJson, color: "text-blue-600 bg-blue-50", action: exportGeoJSON },
        { key: "csv", label: "CSV", desc: "Tabel sederhana tanpa format file", icon: FileText, color: "text-amber-600 bg-amber-50", action: exportCSV },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Export Data</h1>
                <p className="text-sm text-slate-400 mt-0.5">Download data objek dalam struktur kolom baku Geoportal KBAK</p>
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

                {/* Bagian 2: Filter Wilayah */}
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
