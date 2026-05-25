import L from "leaflet";

export const createMarkerIcon = (warna = "#6b7280", ikon = "📍") => {
    const size = 32;
    const isImage = ikon?.startsWith("http") || ikon?.includes("/");
    const isTransparent = warna === "transparent";

    const innerContent = isImage
        ? `<img src="${ikon}" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" />`
        : ikon;

    let html = "";
    if (isTransparent) {
        html = `
        <div style="
            width:${size}px;height:${size}px;
            display:flex;align-items:center;justify-content:center;
            font-size:24px;filter:drop-shadow(0px 3px 4px rgba(0,0,0,0.4));
        ">${innerContent}</div>`;
    } else {
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
        html,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, isTransparent ? size / 2 : size],
        popupAnchor: [0, isTransparent ? -size / 2 : -size],
    });
};

export const buildPopupHTML = (d, isEditor = false) => {
    if (!d) return "<div style='padding:12px'>Data tidak tersedia</div>";

    const warna  = d.jenis_objek?.warna || "#6b7280";
    const ikon   = d.jenis_objek?.ikon  || "📍";
    const jenis  = d.jenis_objek?.nama  || "—";
    const isImage = ikon?.startsWith("http") || ikon?.includes("/");
    
    const isTransparent = warna === "transparent";
    const themeColor = isTransparent ? "#059669" : warna;  // Untuk teks, border, dan gradasi
    
    const headerBg = `linear-gradient(135deg, ${themeColor}15, ${themeColor}05)`;
    const headerBorder = `1px solid ${themeColor}20`;

    const ikonHTML = isImage
        ? `<img src="${ikon}" style="width:12px;height:12px;object-fit:contain;vertical-align:middle;border-radius:50%;" />`
        : `<span style="font-size:11px;line-height:1;">${ikon}</span>`;

    const badgeHTML = `
    <div style="margin-bottom:6px;">
        <span style="
            display:inline-flex;align-items:center;gap:4px;
            font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;
            background:${themeColor}18;color:${themeColor};
            border:1px solid ${themeColor}33;white-space:nowrap;flex-shrink:0;
            text-transform:uppercase;letter-spacing:0.04em;
        ">
            ${ikonHTML}
            <span>${jenis}</span>
        </span>
    </div>`;

    const coords = d.koordinat_y && d.koordinat_x
        ? `${parseFloat(d.koordinat_y).toFixed(5)}, ${parseFloat(d.koordinat_x).toFixed(5)}`
        : null;

    const fotoUrl = d.atribut?.Foto || d.atribut?.foto || d.atribut?.foto_url || d.atribut?.Foto_URL || null;

    const SKIP_KEYS = new Set(["foto", "foto_url", "Foto", "Foto_URL", "photo", "Photo"]);
    const validEntries = d.atribut
        ? Object.entries(d.atribut).filter(([k, v]) =>
            !SKIP_KEYS.has(k) &&
            v != null && v !== "" && v !== "null" && v !== "nan" && v !== "undefined"
        )
        : [];

    const shortEntries = validEntries.filter(([, v]) => String(v).length <= 20);
    const longEntries  = validEntries.filter(([, v]) => String(v).length  > 20);

    const labelStyle = "font-size:10px;color:#94a3b8;margin:0 0 1px;text-transform:uppercase;letter-spacing:0.04em;";
    const valueStyle = "font-size:12px;color:#1e293b;margin:0;font-weight:500;word-break:break-word;";
    const borderB    = "border-bottom:0.5px solid #f1f5f9;";

    const renderShortGrid = (entries) => {
        if (!entries.length) return "";
        let rows = "";
        for (let i = 0; i < entries.length; i += 2) {
            const [k1, v1] = entries[i];
            const pair = entries[i + 1];
            rows += `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px;">
                <div style="padding:4px 0;${i + 2 < entries.length || longEntries.length ? borderB : ""}">
                    <p style="${labelStyle}">${k1.replace(/_/g, " ")}</p>
                    <p style="${valueStyle}">${String(v1)}</p>
                </div>
                ${pair ? `
                <div style="padding:4px 0;${i + 2 < entries.length || longEntries.length ? borderB : ""}">
                    <p style="${labelStyle}">${pair[0].replace(/_/g, " ")}</p>
                    <p style="${valueStyle}">${String(pair[1])}</p>
                </div>` : "<div></div>"}
            </div>`;
        }
        return rows;
    };

    const renderLongList = (entries) => entries.map(([k, v], idx) => `
        <div style="padding:4px 0;${idx < entries.length - 1 ? borderB : ""}">
            <p style="${labelStyle}">${k.replace(/_/g, " ")}</p>
            <p style="${valueStyle}">${String(v)}</p>
        </div>`).join("");

    const editBtn = isEditor
        ? `<a href="/admin/data?edit=${d.id}"
            style="position:absolute;top:10px;right:10px;
                   width:28px;height:28px;
                   background:rgba(255,255,255,0.92);
                   border:0.5px solid rgba(0,0,0,0.12);
                   border-radius:8px;
                   display:flex;align-items:center;justify-content:center;
                   text-decoration:none;cursor:pointer;"
            title="Edit objek ini">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
        </a>`
        : "";

    // ── Dengan foto ──────────────
    if (fotoUrl) {
        return `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:white;border-radius:12px;overflow:hidden;width:100%;min-width:291px;">
            <div style="position:relative;height:140px;overflow:hidden;">
                <img src="${fotoUrl}" style="width:100%;height:100%;object-fit:cover;" />
                <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.25) 0%,transparent 50%);" />
                ${editBtn}
            </div>

            <div style="padding:12px 14px 10px;background:${headerBg};border-bottom:${headerBorder};">
                ${badgeHTML}
                <h3 style="font-size:14px;font-weight:600;color:#0f172a;margin:0;line-height:1.3;">${d.nama_objek || "Tanpa Nama"}</h3>
            </div>

            <div style="padding:8px 14px 10px;">
                ${coords ? `
                <div style="display:flex;align-items:center;gap:7px;padding:5px 8px;background:#f8fafc;border-radius:8px;margin-bottom:7px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${themeColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span style="font-size:11px;color:#64748b;font-family:ui-monospace,monospace;">${coords}</span>
                </div>` : ""}
                ${renderShortGrid(shortEntries)}
                ${renderLongList(longEntries)}
            </div>
        </div>`;
    }

    // ── Tanpa foto ──────────────────────────────────────
    return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:white;border-radius:12px;overflow:hidden;width:100%;min-width:291px;">
        
        <div style="position:relative;padding:12px 14px 10px;background:${headerBg};border-bottom:${headerBorder};">
            ${badgeHTML}
            <h3 style="font-size:14px;font-weight:600;color:#0f172a;margin:0;line-height:1.3;padding-right:${isEditor ? "36px" : "0"};">${d.nama_objek || "Tanpa Nama"}</h3>
            ${isEditor ? `
            <a href="/admin/data?edit=${d.id}"
                style="position:absolute;top:10px;right:10px;
                       width:28px;height:28px;
                       background:white;
                       border:0.5px solid #e2e8f0;
                       border-radius:8px;
                       display:flex;align-items:center;justify-content:center;
                       text-decoration:none;cursor:pointer;
                       box-shadow:0 1px 3px rgba(0,0,0,0.06);"
                title="Edit objek ini">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            </a>` : ""}
        </div>

        <div style="padding:8px 14px 10px;">
            ${coords ? `
            <div style="display:flex;align-items:center;gap:7px;padding:5px 8px;background:#f8fafc;border-radius:8px;margin-bottom:7px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${themeColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style="font-size:11px;color:#64748b;font-family:ui-monospace,monospace;">${coords}</span>
            </div>` : ""}
            ${renderShortGrid(shortEntries)}
            ${renderLongList(longEntries)}
            ${!coords && !validEntries.length ? `<p style="font-size:12px;color:#94a3b8;text-align:center;padding:8px 0;margin:0;">Tidak ada atribut tersedia</p>` : ""}
        </div>
    </div>`;
};
