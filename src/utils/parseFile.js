import shp from "shpjs";
import * as XLSX from "xlsx";

// ── Excel Parser ──────────────────────────────────────────
export const parseExcel = (buffer) => {
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Deteksi 2 baris header (format KBAK standar)
    const firstRow = rows[0] || [];
    const hasTwoRowHeader = firstRow.some((v) => v && ["Koordinat", "Lokasi", "Geologi", "Morfometri", "Hidrologi"].includes(String(v)));

    if (hasTwoRowHeader) {
        // ── Format 2 baris header (format KBAK standar) ──
        // Row 0: No, Kode, Nama Objek, Koordinat, , Klasifikasi Karst, Lokasi, ...
        // Row 1:                       X,        Y,                   Desa, Kecamatan, ...
        // Data mulai baris ke-2 (index 2)
        const items = [];
        for (let i = 2; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.every((v) => v == null || v === "")) continue;

            const x = r[3] != null ? parseFloat(r[3]) : null; // Longitude
            const y = r[4] != null ? parseFloat(r[4]) : null; // Latitude

            // Semua kolom masuk atribut, KECUALI nama & koordinat
            const atribut = {};
            if (r[0] != null) atribut["No"] = r[0];
            if (r[1] != null) atribut["Kode"] = r[1];
            if (r[5] != null) atribut["Klasifikasi Karst"] = r[5];
            if (r[6] != null) atribut["Desa"] = r[6];
            if (r[7] != null) atribut["Kecamatan"] = r[7];
            if (r[8] != null) atribut["Kab_Kota"] = r[8];
            if (r[9] != null) atribut["Provinsi"] = r[9];
            if (r[10] != null) atribut["Jenis Batu"] = r[10];
            if (r[11] != null) atribut["Litologi"] = r[11];
            if (r[12] != null) atribut["Jenis Gua"] = r[12];
            if (r[13] != null) atribut["Elevasi (mdpl)"] = r[13];
            if (r[14] != null) atribut["Diameter (m)"] = r[14];
            if (r[15] != null) atribut["Kedalaman (m)"] = r[15];
            if (r[16] != null) atribut["Kondisi Hidrologi"] = r[16];
            if (r[17] != null) atribut["Fungsi Hidrologi"] = r[17];
            if (r[18] != null) atribut["Foto"] = r[18];
            if (r[19] != null) atribut["Keterangan"] = r[19];

            items.push({
                nama_objek: r[2] ? String(r[2]) : "",
                koordinat_x: isNaN(x) ? null : x, // Longitude
                koordinat_y: isNaN(y) ? null : y, // Latitude
                atribut,
            });
        }
        return items;
    } else {
        // ── Format 1 baris header (format bebas) ──
        const headers = (rows[0] || []).map((h) => String(h ?? "").trim());
        const items = [];

        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.every((v) => v == null || v === "")) continue;

            const obj = {};
            headers.forEach((h, idx) => {
                if (h && r[idx] != null) obj[h] = r[idx];
            });

            const namaKey = headers.find((h) => ["nama objek", "nama_objek", "nama", "name"].includes(h.toLowerCase()));
            const xKey = headers.find((h) => ["x", "longitude", "lon", "koordinat_x"].includes(h.toLowerCase()));
            const yKey = headers.find((h) => ["y", "latitude", "lat", "koordinat_y"].includes(h.toLowerCase()));

            const nama = namaKey ? obj[namaKey] : "";
            const x = xKey ? parseFloat(obj[xKey]) : NaN;
            const y = yKey ? parseFloat(obj[yKey]) : NaN;

            // Hapus kolom koordinat & nama dari atribut agar tidak double
            const atribut = { ...obj };
            if (namaKey) delete atribut[namaKey];
            if (xKey) delete atribut[xKey];
            if (yKey) delete atribut[yKey];

            items.push({
                nama_objek: String(nama || ""),
                koordinat_x: isNaN(x) ? null : x,
                koordinat_y: isNaN(y) ? null : y,
                atribut,
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
