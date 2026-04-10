export const MAP_CONFIG = {
    center: [-2.5, 118.0],
    zoom: 5,
    minZoom: 4,
    maxZoom: 18,
};

export const TILE_LAYERS = {
    street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        label: "Street Map",
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "© Esri World Imagery",
        label: "Satellite",
    },
    topo: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
        label: "Topografi",
    },
};

export const KBAK_LEVELS = {
    1: { color: "#16a34a", label: "Level 1 – Sebaran Batugamping", fillOpacity: 0.2 },
    2: { color: "#ca8a04", label: "Level 2 – Hasil Penyelidikan", fillOpacity: 0.3 },
    3: { color: "#ea580c", label: "Level 3 – Hasil Verifikasi", fillOpacity: 0.4 },
    4: { color: "#dc2626", label: "Level 4 – Telah Ditetapkan", fillOpacity: 0.5 },
};
