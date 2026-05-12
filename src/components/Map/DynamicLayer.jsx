import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import { createMarkerIcon, buildPopupHTML } from "../../utils/markerUtils";

export const DynamicLayer = ({ objekList, isEditor = false }) => {
    const map = useMap();
    const clusterRef = useRef(null);

    useEffect(() => {
        if (clusterRef.current) {
            map.removeLayer(clusterRef.current);
            clusterRef.current = null;
        }
        if (!objekList || objekList.length === 0) return;

        const cluster = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 60,
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

        objekList.forEach((d) => {
            if (!d.koordinat_y || !d.koordinat_x) return;
            const lat = parseFloat(d.koordinat_y);
            const lon = parseFloat(d.koordinat_x);
            if (isNaN(lat) || isNaN(lon)) return;

            const warna = d.jenis_objek?.warna || "#6b7280";
            const ikon = d.jenis_objek?.ikon || "📍";
            
            const marker = L.marker([lat, lon], { icon: createMarkerIcon(warna, ikon) });

            // Geser kamera agar marker berada di bawah
            marker.on("click", (e) => {
                setTimeout(() => {
                    const container = map.getContainer();
                    const h = container.offsetHeight;
                    const w = container.offsetWidth;

                    // 1. Tentukan batas area yang tertutup Sidebar (asumsi 300px)
                    const sidebarWidth = 300;

                    // 2. Tentukan target posisi marker di area yang "aman"
                    // Horizontal: letakkan di tengah-tengah sisa ruang (Layar dikurangi Sidebar)
                    const targetX = ((w - sidebarWidth) / 2) + sidebarWidth;
                    
                    // Vertical: dorong ke 85% tinggi layar (sangat bawah)
                    // agar pop-up yang panjang punya ruang ke atas tanpa menabrak Search Bar
                    const targetY = h * 0.85;

                    const targetPoint = L.point(targetX, targetY);

                    // 3. Hitung selisih posisi saat ini dengan target
                    const markerPoint = map.latLngToContainerPoint(e.latlng);
                    const offset = markerPoint.subtract(targetPoint);

                    // 4. Eksekusi pergeseran peta
                    map.panBy(offset, { animate: true, duration: 0.6 });
                }, 50);
            });

            marker.bindPopup(buildPopupHTML(d, isEditor), { 
                maxWidth: 300, 
                minWidth: 290,
                autoPanPaddingTopLeft: [350, 150], 
                autoPanPaddingBottomRight: [20, 20],
                autoPan: true
            });
            
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
    }, [objekList, isEditor, map]);

    return null;
};
