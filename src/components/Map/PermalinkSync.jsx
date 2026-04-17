import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import { useSearchParams } from "react-router-dom";

// Sync URL params dengan posisi peta
export const PermalinkSync = () => {
    const [, setSearchParams] = useSearchParams();

    useMapEvents({
        moveend: (e) => {
            const center = e.target.getCenter();
            const zoom   = e.target.getZoom();
            setSearchParams(
                { lat: center.lat.toFixed(5), lng: center.lng.toFixed(5), z: zoom },
                { replace: true }
            );
        },
    });

    return null;
};

// Hook untuk baca posisi awal dari URL
export const useInitialView = () => {
    const [searchParams] = useSearchParams();
    const lat  = parseFloat(searchParams.get("lat"));
    const lng  = parseFloat(searchParams.get("lng"));
    const zoom = parseInt(searchParams.get("z"));

    if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
        return { center: [lat, lng], zoom };
    }
    return null;
};