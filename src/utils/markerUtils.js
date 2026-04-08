import L from "leaflet";
import { KLASIFIKASI_COLORS } from "../constants/mapConfig";

export const getKlasifikasiStyle = (klasifikasi) => {
    return KLASIFIKASI_COLORS[klasifikasi] || KLASIFIKASI_COLORS["default"];
};

export const createCustomIcon = (klasifikasi) => {
    const style = getKlasifikasiStyle(klasifikasi);
    const size = 32;
    return L.divIcon({
        html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${style.hex};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          transform:rotate(45deg);
          display:flex;align-items:center;justify-content:center;
          width:100%;height:100%;
          font-size:13px;
        ">${style.emoji}</div>
      </div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};
