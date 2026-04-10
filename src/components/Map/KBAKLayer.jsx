import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { KBAK_LEVELS } from "../../constants/mapConfig";

const buildKBAKPopup = (p) => {
    if (!p) return "<div style='padding:12px'>Data tidak tersedia</div>";

    const level = parseInt(p.KLSKBAK) || 1;
    const cfg = KBAK_LEVELS[level] || KBAK_LEVELS[1];

    return `
    <div style="font-family:'Inter',sans-serif;background:white;border-radius:12px;overflow:hidden;width:280px;">
      <div style="padding:14px 16px 12px;background:${cfg.color}18;border-bottom:3px solid ${cfg.color};">
        <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0 0 6px;line-height:1.3;">
          🗺️ ${p.NAMOBJ || "KBAK Tanpa Nama"}
        </h3>
        <span style="
          display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;
          background:${cfg.color};color:white;
        ">Level ${level}</span>
      </div>
      <div style="padding:10px 16px 12px;">
        <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:13px;flex-shrink:0;">📋</span>
          <div>
            <p style="font-size:11px;color:#94a3b8;margin:0 0 2px;">Klasifikasi</p>
            <p style="font-size:13px;font-weight:500;color:#1e293b;margin:0;">${p.REMARK || "—"}</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:13px;flex-shrink:0;">⚖️</span>
          <div>
            <p style="font-size:11px;color:#94a3b8;margin:0 0 2px;">Dasar Hukum</p>
            <p style="font-size:12px;font-weight:500;color:#1e293b;margin:0;">${p.SKKBAK || "—"}</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;">
          <span style="font-size:13px;flex-shrink:0;">📐</span>
          <div>
            <p style="font-size:11px;color:#94a3b8;margin:0 0 2px;">Luas (derajat²)</p>
            <p style="font-size:13px;font-weight:500;color:#1e293b;margin:0;">${p.Shape_Area ? parseFloat(p.Shape_Area).toFixed(6) : "—"}</p>
          </div>
        </div>
      </div>
    </div>`;
};

export const KBAKLayer = ({ visible }) => {
    const map = useMap();
    const layerRef = useRef(null);
    const dataRef = useRef(null);

    useEffect(() => {
        if (dataRef.current) return;
        fetch("/data/kbak.geojson")
            .then((r) => r.json())
            .then((json) => {
                dataRef.current = json;
                if (visible) addLayer();
            })
            .catch((err) => console.error("Gagal load KBAK:", err));
    }, []); // eslint-disable-line

    const addLayer = () => {
        if (!dataRef.current || layerRef.current) return;
        const layer = L.geoJSON(dataRef.current, {
            style: (feature) => {
                const level = parseInt(feature.properties?.KLSKBAK) || 1;
                const cfg = KBAK_LEVELS[level] || KBAK_LEVELS[1];
                return { color: cfg.color, weight: 1, opacity: 0.8, fillColor: cfg.color, fillOpacity: cfg.fillOpacity };
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(buildKBAKPopup(feature.properties), { maxWidth: 300, minWidth: 280 });
                layer.on("mouseover", function () {
                    this.setStyle({ weight: 2.5, fillOpacity: Math.min(this.options.fillOpacity + 0.2, 0.8) });
                });
                layer.on("mouseout", function () {
                    const level = parseInt(feature.properties?.KLSKBAK) || 1;
                    const cfg = KBAK_LEVELS[level] || KBAK_LEVELS[1];
                    this.setStyle({ weight: 1, fillOpacity: cfg.fillOpacity });
                });
            },
        });
        layer.addTo(map);
        layerRef.current = layer;
    };

    const removeLayer = () => {
        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
        }
    };

    useEffect(() => {
        if (!dataRef.current) return;
        if (visible) addLayer();
        else removeLayer();
    }, [visible]); // eslint-disable-line

    useEffect(() => () => removeLayer(), []); // eslint-disable-line

    return null;
};
