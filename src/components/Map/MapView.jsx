import { useState } from "react";
import { MapContainer } from "react-leaflet";
import { MAP_CONFIG } from "../../constants/mapConfig";
import { ClusterLayer } from "./ClusterLayer";
import { KBAKLayer } from "./KBAKLayer";
import { MapControls } from "./MapControls";
import { Legend } from "../UI/Legend";

export const MapView = ({ filtered, showKBAK, onToggleKBAK }) => (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
        <MapContainer center={MAP_CONFIG.center} zoom={MAP_CONFIG.zoom} minZoom={MAP_CONFIG.minZoom} maxZoom={MAP_CONFIG.maxZoom} zoomControl={false} style={{ width: "100%", height: "100%", background: "#e8edf2" }}>
            <MapControls />
            <KBAKLayer visible={showKBAK} />
            <ClusterLayer features={filtered} />
        </MapContainer>
        <Legend showKBAK={showKBAK} onToggleKBAK={onToggleKBAK} />
    </div>
);
