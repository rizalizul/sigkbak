import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { KBAK_LEVELS } from "../../constants/mapConfig";

const buildPopup = (p) => {
    if (!p) return "<div style='padding:12px'>Data tidak tersedia</div>";
    const level = parseInt(p.KLSKBAK) || 1;
    const cfg = KBAK_LEVELS[level] || KBAK_LEVELS[1];
    return `
    <div style="font-family:'Inter',sans-serif;background:white;border-radius:12px;overflow:hidden;width:280px;">
      <div style="padding:14px 16px 12px;background:${cfg.color}18;border-bottom:3px solid ${cfg.color};">
        <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0 0 6px;">${p.NAMOBJ || "KBAK Tanpa Nama"}</h3>
        <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${cfg.color};color:white;">Level ${level}</span>
      </div>
      <div style="padding:10px 16px 12px;font-size:13px;color:#1e293b;">
        <p style="margin:0 0 4px;"><b>Klasifikasi:</b> ${p.REMARK || "—"}</p>
        <p style="margin:0 0 4px;"><b>Dasar Hukum:</b> ${p.SKKBAK || "—"}</p>
      </div>
    </div>`;
};

export const KBAKLayer = ({ visible }) => {
    const map = useMap();
    const layerRef = useRef(null);
    const dataRef = useRef(null);

    useEffect(() => {
        fetch("/data/kbak.geojson")
            .then((r) => r.json())
            .then((json) => {
                dataRef.current = json;
                if (visible) addLayer();
            })
            .catch(console.error);
    }, []); // eslint-disable-line

    const addLayer = () => {
        if (!dataRef.current || layerRef.current) return;
        const layer = L.geoJSON(dataRef.current, {
            style: (f) => {
                const level = parseInt(f.properties?.KLSKBAK) || 1;
                const cfg = KBAK_LEVELS[level] || KBAK_LEVELS[1];
                return { color: cfg.color, weight: 1, opacity: 0.8, fillColor: cfg.color, fillOpacity: cfg.fillOpacity };
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(buildPopup(feature.properties), { maxWidth: 300, minWidth: 280 });
                layer.on("mouseover", function () {
                    this.setStyle({ weight: 2.5 });
                });
                layer.on("mouseout", function () {
                    this.setStyle({ weight: 1 });
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
        visible ? addLayer() : removeLayer();
    }, [visible]); // eslint-disable-line

    useEffect(() => () => removeLayer(), []); // eslint-disable-line

    return null;
};
