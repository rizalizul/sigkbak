import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import { createCustomIcon, getKlasifikasiStyle } from "../../utils/markerUtils";

const buildPopup = (d) => {
    if (!d) return "<div style='padding:12px'>Data tidak tersedia</div>";
    const style = getKlasifikasiStyle(d.klasifikasi_karst);
    const coords = d.koordinat_y && d.koordinat_x ? `${parseFloat(d.koordinat_y).toFixed(5)}, ${parseFloat(d.koordinat_x).toFixed(5)}` : null;
    const lokasi = [d.desa, d.kecamatan].filter(Boolean).join(", ");
    const wilayah = [d.kab_kota, d.provinsi].filter(Boolean).join(", ");
    const geologi = [d.jenis_batu, d.litologi].filter(Boolean).join(" · ");

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

    return `
    <div style="font-family:'Inter',sans-serif;background:white;border-radius:12px;overflow:hidden;width:290px;">
      <div style="padding:14px 16px 12px;background:${style.hex}20;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0;flex:1;">${d.nama_objek || "Tanpa Nama"}</h3>
          <span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;background:${style.hex}18;color:${style.hex};border:1px solid ${style.hex}33;white-space:nowrap;">${style.emoji} ${d.klasifikasi_karst || "—"}</span>
        </div>
        ${d.kode ? `<span style="font-size:11px;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:6px;font-family:monospace;">${d.kode}</span>` : ""}
      </div>
      <div style="padding:4px 16px;">
        ${coords ? row("📍", "Koordinat", coords) : ""}
        ${lokasi ? row("🏘️", "Desa / Kecamatan", lokasi) : ""}
        ${wilayah ? row("🏛️", "Kab/Kota & Provinsi", wilayah) : ""}
        ${d.elevasi_mdpl ? row("⛰️", "Elevasi", `${d.elevasi_mdpl} mdpl`) : ""}
        ${d.kedalaman_m ? row("⬇️", "Kedalaman", `${d.kedalaman_m} m`) : ""}
        ${d.diameter_m ? row("↔️", "Diameter", `${d.diameter_m} m`) : ""}
        ${geologi ? row("🪨", "Geologi", geologi) : ""}
        ${d.hidrologi_kondisi ? row("💧", "Hidrologi", [d.hidrologi_kondisi, d.hidrologi_fungsi].filter(Boolean).join(" · ")) : ""}
        ${d.status ? row("📌", "Status", d.status) : ""}
      </div>
      ${d.keterangan ? `<div style="padding:8px 16px 12px;"><p style="font-size:12px;color:#64748b;background:#f8fafc;border-radius:8px;padding:8px;margin:0;">📝 ${d.keterangan}</p></div>` : ""}
      ${d.foto_url ? `<div style="padding:0 16px 12px;"><img src="${d.foto_url}" style="width:100%;border-radius:8px;object-fit:cover;max-height:140px;" /></div>` : ""}
    </div>`;
};

export const ClusterLayer = ({ features }) => {
    const map = useMap();
    const clusterRef = useRef(null);

    useEffect(() => {
        if (clusterRef.current) {
            map.removeLayer(clusterRef.current);
            clusterRef.current = null;
        }
        if (!features || features.length === 0) return;

        const cluster = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 60,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            iconCreateFunction: (c) => {
                const count = c.getChildCount();
                const size = count < 10 ? 36 : count < 100 ? 42 : 50;
                return L.divIcon({
                    html: `<div style="width:${size}px;height:${size}px;background:rgba(15,23,42,0.92);backdrop-filter:blur(6px);color:white;font-weight:700;font-size:${count > 99 ? 11 : 13}px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid rgba(255,255,255,0.3);box-shadow:0 4px 16px rgba(0,0,0,0.25);">${count}</div>`,
                    className: "",
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                });
            },
        });

        features.forEach((d) => {
            if (!d.koordinat_y || !d.koordinat_x) return;
            const lat = parseFloat(d.koordinat_y);
            const lon = parseFloat(d.koordinat_x);
            if (isNaN(lat) || isNaN(lon)) return;

            const marker = L.marker([lat, lon], { icon: createCustomIcon(d.klasifikasi_karst) });
            marker.bindPopup(buildPopup(d), { maxWidth: 300, minWidth: 290 });
            cluster.addLayer(marker);
        });

        map.addLayer(cluster);
        clusterRef.current = cluster;

        return () => {
            if (clusterRef.current) {
                map.removeLayer(clusterRef.current);
                clusterRef.current = null;
            }
        };
    }, [features, map]);

    return null;
};
