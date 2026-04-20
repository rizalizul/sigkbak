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
    
    // Tambahkan defval: "" agar sel yang kosong karena di-merge tidak terbaca sebagai undefined
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    if (rows.length < 2) return [];

    const row1 = rows[0] || [];
    // Deteksi jika ini adalah file dengan 2 baris header (Merge Cells)
    const hasTwoRowHeader = row1.some((v) => v && ["Koordinat", "Lokasi", "Geologi", "Morfometri", "Hidrologi", "Nama Objek"].includes(String(v)));

    if (hasTwoRowHeader) {
        // ── FORMAT 2 BARIS HEADER (SMART HEADER REPAIR) ──
        const row2 = rows[1] || [];
        const finalHeaders = [];
        const maxCols = Math.max(row1.length, row2.length);

        // 1. LOGIKA PENAMBALAN HEADER
        for (let i = 0; i < maxCols; i++) {
            const h2 = row2[i] ? String(row2[i]).trim() : "";
            const h1 = row1[i] ? String(row1[i]).trim() : "";
            finalHeaders.push(h2 !== "" ? h2 : h1);
        }

        const items = [];
        for (let i = 2; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.every((v) => v === "")) continue;

            const obj = {};
            finalHeaders.forEach((h, idx) => {
                if (h && r[idx] !== "") obj[h] = r[idx];
            });

            // Cari kolom esensial
            const namaKey = finalHeaders.find((h) => ["nama objek", "nama_objek", "nama", "name"].includes(h.toLowerCase()));
            const xKey = finalHeaders.find((h) => ["x", "longitude", "lon", "koordinat_x", "bujur"].includes(h.toLowerCase()));
            const yKey = finalHeaders.find((h) => ["y", "latitude", "lat", "koordinat_y", "lintang"].includes(h.toLowerCase()));
            const provinsiKey = finalHeaders.find((h) => ["provinsi", "propinsi", "province"].includes(h.toLowerCase()));

            const nama = namaKey ? obj[namaKey] : "";
            let x = xKey ? parseFloat(obj[xKey]) : NaN;
            let y = yKey ? parseFloat(obj[yKey]) : NaN;
            const namaProvinsi = provinsiKey && obj[provinsiKey] ? String(obj[provinsiKey]).toUpperCase().trim() : "";

            // 🌟 LOGIKA KONVERSI UTM OTOMATIS (BLOK 1) 🌟
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

            const atribut = { ...obj };
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

    } else {
        // ── FORMAT 1 BARIS HEADER (Format Bebas) ──
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
            let x = xKey ? parseFloat(obj[xKey]) : NaN;
            let y = yKey ? parseFloat(obj[yKey]) : NaN;
            const namaProvinsi = provinsiKey && obj[provinsiKey] ? String(obj[provinsiKey]).toUpperCase().trim() : "";

            // 🌟 LOGIKA KONVERSI UTM OTOMATIS (BLOK 2) 🌟
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

            const atribut = { ...obj };
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
    }
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
    const byExt = (ext) => files.find((f) => f.name.toLowerCase().endsWith(ext));
    const zipFile = byExt(".zip");
    const shpFile = byExt(".shp");
    const dbfFile = byExt(".dbf");

    let geojson;
    if (zipFile) {
        geojson = await shp(await readBuffer(zipFile));
    } else if (shpFile && dbfFile) {
        const [shpBuf, dbfBuf] = await Promise.all([readBuffer(shpFile), readBuffer(dbfFile)]);
        geojson = shp.combine([shp.parseShp(shpBuf), shp.parseDbf(dbfBuf)]);
    } else if (shpFile) {
        const geoms = shp.parseShp(await readBuffer(shpFile));
        geojson = { type: "FeatureCollection", features: geoms.map((g) => ({ type: "Feature", geometry: g, properties: {} })) };
    } else {
        throw new Error("File tidak lengkap. Butuh minimal .shp atau .zip");
    }

    const collections = Array.isArray(geojson) ? geojson : [geojson];
    const items = [];

    for (const fc of collections) {
        for (const feature of fc.features || []) {
            const g = feature.geometry;
            const props = { ...feature.properties } || {};
            const coords = g?.type === "Point" ? g.coordinates : g?.type === "MultiPoint" ? g.coordinates[0] : null;

            // Cari nama dari properties
            const namaKey = Object.keys(props).find((k) => ["nama_objek", "nama", "name", "nama_lokasi"].includes(k.toLowerCase()));
            const nama = namaKey ? String(props[namaKey] ?? "") : "";

            // Hapus nama dari atribut agar tidak double
            if (namaKey) delete props[namaKey];

            items.push({
                nama_objek: nama,
                koordinat_x: coords?.[0] ?? null, // Longitude
                koordinat_y: coords?.[1] ?? null, // Latitude
                atribut: props,
            });
        }
    }

    if (items.length === 0) throw new Error("Tidak ada data yang berhasil dibaca.");
    return items;
};
