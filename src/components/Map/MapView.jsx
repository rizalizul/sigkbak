import { MapContainer }  from "react-leaflet";
import { MAP_CONFIG }    from "../../constants/mapConfig";
import { MapControls }   from "./MapControls";
import { KBAKLayer }     from "./KBAKLayer";
import { DynamicLayer }  from "./DynamicLayer";
import { PermalinkSync } from "./PermalinkSync";
import { GeoSearch }     from "./GeoSearch";

export const MapView = ({ objekList, showKBAK, onToggleKBAK, isEditor = false, initialView }) => (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
        <MapContainer
            center={initialView?.center ?? MAP_CONFIG.center}
            zoom={initialView?.zoom   ?? MAP_CONFIG.zoom}
            minZoom={MAP_CONFIG.minZoom}
            maxZoom={MAP_CONFIG.maxZoom}
            zoomControl={false}
            style={{ width: "100%", height: "100%", background: "#e8edf2" }}>
            <MapControls />
            <KBAKLayer visible={showKBAK} />
            <DynamicLayer objekList={objekList} isEditor={isEditor} />
            <PermalinkSync />

            {/* GeoSearch overlay */}
            <div style={{
                position: "absolute", top: "16px",
                left: "50%", transform: "translateX(-50%)",
                zIndex: 1000, width: "320px",
            }}>
                <GeoSearch />
            </div>
        </MapContainer>
    </div>
);
