import { MapContainer } from "react-leaflet";
import { MAP_CONFIG } from "../../constants/mapConfig";
import { MapControls } from "./MapControls";
import { KBAKLayer } from "./KBAKLayer";
import { DynamicLayer } from "./DynamicLayer";

export const MapView = ({ objekList, showKBAK, onToggleKBAK, isEditor = false }) => (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
        <MapContainer center={MAP_CONFIG.center} zoom={MAP_CONFIG.zoom} minZoom={MAP_CONFIG.minZoom} maxZoom={MAP_CONFIG.maxZoom} zoomControl={false} style={{ width: "100%", height: "100%", background: "#e8edf2" }}>
            <MapControls />
            <KBAKLayer visible={showKBAK} />
            <DynamicLayer objekList={objekList} isEditor={isEditor} />
        </MapContainer>
    </div>
);
