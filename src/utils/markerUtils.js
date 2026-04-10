import L from "leaflet";

export const createMarkerIcon = (warna = "#6b7280", ikon = "📍") => {
    const size = 32;
    return L.divIcon({
        html: `
        <div style="
            width:${size}px;height:${size}px;background:${warna};
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">
            <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:13px;">${ikon}</div>
        </div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};

export const buildPopupHTML = (d) => {
    if (!d) return "<div style='padding:12px'>Data tidak tersedia</div>";
    const warna = d.jenis_objek?.warna || "#6b7280";
    const ikon = d.jenis_objek?.ikon || "📍";
    const jenis = d.jenis_objek?.nama || "—";

    const row = (icon, label, value) =>
        !value
            ? ""
            : `
      <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:13px;flex-shrink:0;">${icon}</span>
        <div>
          <p style="font-size:11px;color:#94a3b8;margin:0 0 2px;">${label}</p>
          <p style="font-size:13px;font-weight:500;color:#1e293b;margin:0;">${value}</p>
        </div>
      </div>`;

    const coords = d.koordinat_y && d.koordinat_x ? `${parseFloat(d.koordinat_y).toFixed(5)}, ${parseFloat(d.koordinat_x).toFixed(5)}` : null;

    // Render atribut JSONB dinamis
    const atributRows = d.atribut
        ? Object.entries(d.atribut)
              .filter(([, v]) => v != null && v !== "" && v !== "null" && v !== "nan")
              .map(([k, v]) => row("•", k.replace(/_/g, " "), String(v)))
              .join("")
        : "";

    return `
    <div style="font-family:'Inter',sans-serif;background:white;border-radius:12px;overflow:hidden;width:290px;">
      <div style="padding:14px 16px 12px;background:${warna}18;border-bottom:2px solid ${warna}22;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0;flex:1;">${d.nama_objek || "Tanpa Nama"}</h3>
          <span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;background:${warna}22;color:${warna};border:1px solid ${warna}44;white-space:nowrap;">${ikon} ${jenis}</span>
        </div>
      </div>
      <div style="padding:4px 16px 4px;">
        ${coords ? row("📍", "Koordinat", coords) : ""}
        ${atributRows}
      </div>
      ${d.atribut?.foto_url ? `<div style="padding:0 16px 12px;"><img src="${d.atribut.foto_url}" style="width:100%;border-radius:8px;object-fit:cover;max-height:140px;"/></div>` : ""}
    </div>`;
};
