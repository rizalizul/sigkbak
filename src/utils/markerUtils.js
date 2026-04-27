import L from "leaflet";

// 1. Fungsi Pembuat Marker (Mendukung Emoji, URL Gambar, dan Transparan)
export const createMarkerIcon = (warna = "#6b7280", ikon = "📍") => {
    const size = 32;
    // Cek apakah ikon berupa URL (mengandung http atau /)
    const isImage = ikon?.startsWith("http") || ikon?.includes("/");
    const isTransparent = warna === "transparent";

    // Isi di dalam marker (Tag <img> jika gambar, Teks jika emoji)
    const innerContent = isImage 
        ? `<img src="${ikon}" style="width:100%;height:100%;object-fit:contain; border-radius:50%;" />` 
        : ikon;

    let html = "";
    
    if (isTransparent) {
        // Mode Transparan: Hanya menampilkan Ikon/Gambar melayang dengan bayangan
        html = `
        <div style="
            width:${size}px;height:${size}px;
            display:flex;align-items:center;justify-content:center;
            font-size:24px; filter:drop-shadow(0px 3px 4px rgba(0,0,0,0.4));
        ">
            ${innerContent}
        </div>`;
    } else {
        // Mode Standar: Pin berbentuk tetesan air (Teardrop)
        html = `
        <div style="
            width:${size}px;height:${size}px;background:${warna};
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">
            <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:13px;overflow:hidden;border-radius:50%;padding:3px;">
                ${innerContent}
            </div>
        </div>`;
    }

    return L.divIcon({
        html: html,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, isTransparent ? size / 2 : size], // Jangkar menyesuaikan bentuk
        popupAnchor: [0, isTransparent ? -size/2 : -size],
    });
};

// 2. Fungsi Pembuat Pop-Up
export const buildPopupHTML = (d, isEditor = false) => {
    if (!d) return "<div style='padding:12px'>Data tidak tersedia</div>";
    
    const warna = d.jenis_objek?.warna || "#6b7280";
    const ikon = d.jenis_objek?.ikon || "📍";
    const jenis = d.jenis_objek?.nama || "—";
    
    // Penyesuaian untuk pop-up jika ikon berupa gambar dan warna transparan
    const isImage = ikon?.startsWith("http") || ikon?.includes("/");
    const renderIkon = isImage ? `<img src="${ikon}" style="width:14px;height:14px;vertical-align:text-bottom;object-fit:contain;"/>` : ikon;
    const bgWarna = warna === "transparent" ? "#94a3b8" : warna; // Abu-abu default jika transparan

    const row = (icon, label, value) => !value ? "" : `
      <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:13px;flex-shrink:0;">${icon}</span>
        <div>
          <p style="font-size:11px;color:#94a3b8;margin:0 0 2px;">${label}</p>
          <p style="font-size:13px;font-weight:500;color:#1e293b;margin:0;">${value}</p>
        </div>
      </div>`;

    const coords = d.koordinat_y && d.koordinat_x ? `${parseFloat(d.koordinat_y).toFixed(5)}, ${parseFloat(d.koordinat_x).toFixed(5)}` : null;

    const atributRows = d.atribut
        ? Object.entries(d.atribut).filter(([, v]) => v != null && v !== "" && v !== "null" && v !== "nan").map(([k, v]) => row("•", k.replace(/_/g, " "), String(v))).join("")
        : "";

    const editBtn = isEditor ? `
        <div style="padding:8px 16px 12px;">
            <a href="/admin/data?edit=${d.id}" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;background:#1e293b;color:white;border-radius:10px;font-size:12px;font-weight:600;text-decoration:none;">✏️ Edit Objek Ini</a>
        </div>` : "";

    return `
    <div style="font-family:'Inter',sans-serif;background:white;border-radius:12px;overflow:hidden;width:290px;">
      <div style="padding:14px 16px 12px;background:${bgWarna}18;border-bottom:2px solid ${bgWarna}22;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0;flex:1;">${d.nama_objek || "Tanpa Nama"}</h3>
          <span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;background:${bgWarna}22;color:${bgWarna === "transparent" ? "#475569" : bgWarna};border:1px solid ${bgWarna}44;white-space:nowrap;display:flex;gap:4px;align-items:center;">
             ${renderIkon} ${jenis}
          </span>
        </div>
      </div>
      <div style="padding:4px 16px 4px;">
        ${coords ? row("📍", "Koordinat", coords) : ""}
        ${atributRows}
      </div>
      ${d.atribut?.Foto ? `<div style="padding:0 16px 12px;"><img src="${d.atribut.Foto}" style="width:100%;border-radius:8px;object-fit:cover;max-height:140px;"/></div>` : ""}
      ${editBtn}
    </div>`;
};
