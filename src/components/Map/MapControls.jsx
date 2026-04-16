import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { TileLayer } from "react-leaflet";
import { Layers, Plus, Minus, Crosshair, Square } from "lucide-react";
import { TILE_LAYERS } from "../../constants/mapConfig";
import L from "leaflet";

// Custom Box Zoom handler tanpa perlu Shift
const useBoxZoom = (map, active) => {
    const stateRef = useRef({ dragging: false, startPoint: null, rect: null });

    useEffect(() => {
        if (!map) return;

        const container = map.getContainer();

        const onMouseDown = (e) => {
            if (!active || e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();

            // Disable map drag
            map.dragging.disable();

            const containerRect = container.getBoundingClientRect();
            stateRef.current.startPoint = {
                x: e.clientX - containerRect.left,
                y: e.clientY - containerRect.top,
            };
            stateRef.current.dragging = true;

            // Buat elemen kotak seleksi
            const rect = document.createElement("div");
            rect.style.cssText = `
                position:absolute;border:2px dashed #1e293b;background:rgba(30,41,59,0.1);
                pointer-events:none;z-index:9999;border-radius:4px;
            `;
            container.style.position = "relative";
            container.appendChild(rect);
            stateRef.current.rect = rect;
        };

        const onMouseMove = (e) => {
            if (!stateRef.current.dragging || !stateRef.current.startPoint) return;

            const containerRect = container.getBoundingClientRect();
            const curX = e.clientX - containerRect.left;
            const curY = e.clientY - containerRect.top;
            const { x: sx, y: sy } = stateRef.current.startPoint;

            const left = Math.min(sx, curX);
            const top = Math.min(sy, curY);
            const width = Math.abs(curX - sx);
            const height = Math.abs(curY - sy);

            if (stateRef.current.rect) {
                Object.assign(stateRef.current.rect.style, {
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                });
            }
        };

        const onMouseUp = (e) => {
            if (!stateRef.current.dragging) return;

            map.dragging.enable();
            stateRef.current.dragging = false;

            if (stateRef.current.rect) {
                stateRef.current.rect.remove();
                stateRef.current.rect = null;
            }

            if (!stateRef.current.startPoint) return;

            const containerRect = container.getBoundingClientRect();
            const endX = e.clientX - containerRect.left;
            const endY = e.clientY - containerRect.top;
            const { x: sx, y: sy } = stateRef.current.startPoint;
            stateRef.current.startPoint = null;

            const width = Math.abs(endX - sx);
            const height = Math.abs(endY - sy);
            if (width < 10 || height < 10) return; // terlalu kecil, abaikan

            const topLeft = map.containerPointToLatLng(L.point(Math.min(sx, endX), Math.min(sy, endY)));
            const bottomRight = map.containerPointToLatLng(L.point(Math.max(sx, endX), Math.max(sy, endY)));
            map.fitBounds(L.latLngBounds(topLeft, bottomRight));
        };

        container.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        // Ubah cursor saat mode aktif
        container.style.cursor = active ? "crosshair" : "";

        return () => {
            container.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            container.style.cursor = "";
            map.dragging.enable();
            if (stateRef.current.rect) {
                stateRef.current.rect.remove();
                stateRef.current.rect = null;
            }
        };
    }, [map, active]);
};

export const MapControls = () => {
    const map = useMap();
    const [activeTile, setActiveTile] = useState("street");
    const [showTileMenu, setShowTileMenu] = useState(false);
    const [boxZoomActive, setBoxZoomActive] = useState(false);

    useBoxZoom(map, boxZoomActive);

    return (
        <>
            <TileLayer key={activeTile} url={TILE_LAYERS[activeTile].url} attribution={TILE_LAYERS[activeTile].attribution} maxZoom={18} />

            {/* Zoom + Center + BoxZoom */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
                {[
                    { icon: Plus, action: () => map.setZoom(map.getZoom() + 1), title: "Zoom In" },
                    { icon: Minus, action: () => map.setZoom(map.getZoom() - 1), title: "Zoom Out" },
                    { icon: Crosshair, action: () => map.setView([-2.5, 118.0], 5), title: "Pusat Indonesia" },
                ].map(({ icon: Icon, action, title }) => (
                    <button
                        key={title}
                        onClick={action}
                        title={title}
                        className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                    >
                        <Icon size={15} />
                    </button>
                ))}

                <button
                    onClick={() => setBoxZoomActive((p) => !p)}
                    title={boxZoomActive ? "Nonaktifkan Zoom Area" : "Zoom Area — drag kotak di peta"}
                    className={`w-9 h-9 backdrop-blur-sm rounded-xl shadow-md border flex items-center justify-center transition-all ${boxZoomActive ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400" : "bg-white/95 border-slate-100 text-slate-600 hover:bg-slate-50"}`}
                >
                    <Square size={14} />
                </button>
            </div>

            {/* Badge aktif box zoom */}
            {boxZoomActive && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 text-white text-xs rounded-xl px-4 py-2 shadow-lg backdrop-blur-sm pointer-events-none">📦 Drag kotak area yang ingin diperbesar</div>
            )}

            {/* Tile Switcher */}
            <div className="absolute top-4 right-16 z-[1000]">
                <button
                    onClick={() => setShowTileMenu((p) => !p)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                >
                    <Layers size={14} />
                    {TILE_LAYERS[activeTile].label}
                </button>
                {showTileMenu && (
                    <div className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden min-w-[140px]">
                        {Object.entries(TILE_LAYERS).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setActiveTile(key);
                                    setShowTileMenu(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${activeTile === key ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700"}`}
                            >
                                {val.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
