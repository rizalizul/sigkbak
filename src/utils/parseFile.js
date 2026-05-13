import shp from "shpjs";
import * as XLSX from "xlsx";
import proj4 from "proj4";

// ── Kamus Pemetaan Provinsi ke Zona UTM ───────────────────
const PROVINCE_TO_UTM = {
    "ACEH": "47N", "SUMATERA UTARA": "47N", "SUMATERA BARAT": "47S",
    "RIAU": "47N", "JAMBI": "48S", "SUMATERA SELATAN": "48S",
    "BENGKULU": "47S", "LAMPUNG": "48S", "KEPULAUAN BANGKA BELITUNG": "48S",
    "KEPULAUAN RIAU": "48N", "DKI JAKARTA": "48S", "JAWA BARAT": "48S",
    "BANTEN": "48S", "JAWA TENGAH": "49S", "DAERAH ISTIMEWA YOGYAKARTA": "49S",
    "JAWA TIMUR": "49S", "BALI": "50S", "NUSA TENGGARA BARAT": "50S",
    "NUSA TENGGARA TIMUR": "51S", "KALIMANTAN BARAT": "49S", "KALIMANTAN TENGAH": "49S",
    "KALIMANTAN SELATAN": "50S", "KALIMANTAN TIMUR": "50N", "KALIMANTAN UTARA": "50N",
    "SULAWESI UTARA": "51N", "SULAWESI TENGAH": "51S", "SULAWESI SELATAN": "51S",
    "SULAWESI TENGGARA": "51S", "GORONTALO": "51N", "SULAWESI BARAT": "50S",
    "MALUKU": "52S", "MALUKU UTARA": "52N", "PAPUA BARAT": "53S", "PAPUA": "54S"
};

const getUtmProj = (zoneStr) => {
    if (!zoneStr) return null;
    const zone = zoneStr.match(/\d+/)[0];
    const isSouth = zoneStr.includes('S');
    return `+proj=utm +zone=${zone} ${isSouth ? '+south ' : ''}+datum=WGS84 +units=m +no_defs`;
};

// ── Excel Parser ──────────────────────────────────────────
export const parseExcel = (buffer) => {
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    
    // defval: "" agar sel yang kosong tidak terbaca undefined
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    if (rows.length < 2) throw new Error("File Excel kosong atau tidak valid.");

    // Deteksi 2 baris header
    const row1Check = (rows[0] || []).map((h) => String(h ?? "").toLowerCase().trim());
    const isOldFormat = row1Check.some((v) => 
        ["koordinat", "lokasi", "geologi", "morfometri", "hidrologi"].includes(v)
    );

    if (isOldFormat) {
        throw new Error("Format Ditolak: File menggunakan header 2 baris (Merge Cells). Harap pastikan header hanya 1 baris dan data dimulai di baris 2.");
    }

    // ── FORMAT STANDAR: Baris 1 Header, Baris 2 Data ──
    const headers = (rows[0] || []).map((h) => String(h ?? "").trim());
    const items = [];

    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.every((v) => v === "")) continue;

        const obj = {};
        headers.forEach((h, idx) => {
            if (h && r[idx] !== "") obj[h] = r[idx];
        });

        const namaKey = headers.find((h) => ["nama objek", "nama_objek", "nama", "name"].includes(h.toLowerCase()));
        const xKey = headers.find((h) => ["x", "longitude", "lon", "koordinat_x"].includes(h.toLowerCase()));
        const yKey = headers.find((h) => ["y", "latitude", "lat", "koordinat_y"].includes(h.toLowerCase()));
        const provinsiKey = headers.find((h) => ["provinsi", "propinsi", "province"].includes(h.toLowerCase()));

        const nama = namaKey ? obj[namaKey] : "";
        
        // Ganti koma dengan titik (jika ada admin typo ketik koodinat pakai koma)
        let x = xKey ? parseFloat(String(obj[xKey]).replace(',', '.')) : NaN;
        let y = yKey ? parseFloat(String(obj[yKey]).replace(',', '.')) : NaN;
        
        const namaProvinsi = provinsiKey && obj[provinsiKey] ? String(obj[provinsiKey]).toUpperCase().trim() : "";

        // LOGIKA KONVERSI UTM OTOMATIS
        let conversionError = null;
        if (!isNaN(x) && !isNaN(y) && Math.abs(x) > 180) {
            const utmZone = PROVINCE_TO_UTM[namaProvinsi];
            if (utmZone) {
                const utmProj = getUtmProj(utmZone);
                const wgs84Proj = "+proj=longlat +datum=WGS84 +no_defs";
                try {
                    const converted = proj4(utmProj, wgs84Proj, [x, y]);
                    x = converted[0];
                    y = converted[1];
                } catch (err) {
                    conversionError = "Gagal konversi koordinat UTM";
                    x = null; y = null;
                }
            } else {
                conversionError = "UTM terdeteksi, tapi kolom Provinsi kosong/tidak valid";
                x = null; y = null;
            }
        }

        // Susun atribut JSON tambahan
        const atribut = { ...obj };
        
        // Hapus kunci wajib dari dalam atribut agar tidak double di database
        if (namaKey) delete atribut[namaKey];
        if (xKey) delete atribut[xKey];
        if (yKey) delete atribut[yKey];

        items.push({
            nama_objek: String(nama || ""),
            koordinat_x: isNaN(x) ? null : x,
            koordinat_y: isNaN(y) ? null : y,
            atribut,
            error: conversionError
        });
    }
    
    return items;
};

// ── Shapefile Parser ──────────────────────────────────────
const readBuffer = (file) =>
    new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.onerror = rej;
        reader.readAsArrayBuffer(file);
    });

export const parseShapefiles = async (files) => {
    // Hanya cari file ZIP
    const zipFile = files.find((f) => f.name.toLowerCase().endsWith(".zip"));
    
    if (!zipFile) {
        throw new Error("Format Ditolak: Shapefile (.shp, .dbf, dll) wajib dimasukkan ke dalam satu file .zip sebelum di-upload.");
    }

    // shp() otomatis akan membaca seluruh isi dalam zip (shp, dbf, prj)
    const geojson = await shp(await readBuffer(zipFile));

    const collections = Array.isArray(geojson) ? geojson : [geojson];
    const items = [];

    for (const fc of collections) {
        for (const feature of fc.features || []) {
            const g = feature.geometry;
            const props = { ...feature.properties } || {};
            const coords = g?.type === "Point" ? g.coordinates : g?.type === "MultiPoint" ? g.coordinates[0] : null;

            // Cari nama dari properties (SHP memotong nama kolom jadi max 10 huruf)
            const namaKey = Object.keys(props).find((k) => ["nama objek", "nama_objek", "nama_obj"].includes(k.toLowerCase()));
            const nama = namaKey ? String(props[namaKey] ?? "") : "";

            if (namaKey) delete props[namaKey];
            
            const xKey = Object.keys(props).find((k) => k.toLowerCase() === "x");
            const yKey = Object.keys(props).find((k) => k.toLowerCase() === "y");
            if (xKey) delete props[xKey];
            if (yKey) delete props[yKey];

            items.push({
                nama_objek: nama,
                koordinat_x: coords?.[0] ?? null,
                koordinat_y: coords?.[1] ?? null,
                atribut: props,
            });
        }
    }

    if (items.length === 0) throw new Error("Tidak ada data yang berhasil dibaca dari file ZIP.");
    return items;
};
