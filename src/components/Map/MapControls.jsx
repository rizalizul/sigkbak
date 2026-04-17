import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { TileLayer } from "react-leaflet";
import { Layers, Plus, Minus, Crosshair, Square, Ruler } from "lucide-react";
import { TILE_LAYERS } from "../../constants/mapConfig";
import L from "leaflet";

// ── Box Zoom Custom ───────────────────────────────────────
const useBoxZoom = (map, active) => {
    const stateRef = useRef({ dragging: false, startPoint: null, rect: null });

    useEffect(() => {
        if (!map) return;
        const container = map.getContainer();

        const onMouseDown = (e) => {
            if (!active || e.button !== 0) return;
            e.preventDefault(); e.stopPropagation();
            map.dragging.disable();
            const cr = container.getBoundingClientRect();
            stateRef.current.startPoint = { x: e.clientX - cr.left, y: e.clientY - cr.top };
            stateRef.current.dragging = true;
            const rect = document.createElement("div");
            rect.style.cssText = "position:absolute;border:2px dashed #1e293b;background:rgba(30,41,59,0.1);pointer-events:none;z-index:9999;border-radius:4px;";
            container.style.position = "relative";
            container.appendChild(rect);
            stateRef.current.rect = rect;
        };

        const onMouseMove = (e) => {
            if (!stateRef.current.dragging || !stateRef.current.startPoint) return;
            const cr = container.getBoundingClientRect();
            const curX = e.clientX - cr.left, curY = e.clientY - cr.top;
            const { x: sx, y: sy } = stateRef.current.startPoint;
            if (stateRef.current.rect) {
                Object.assign(stateRef.current.rect.style, {
                    left: `${Math.min(sx, curX)}px`, top: `${Math.min(sy, curY)}px`,
                    width: `${Math.abs(curX - sx)}px`, height: `${Math.abs(curY - sy)}px`,
                });
            }
        };

        const onMouseUp = (e) => {
            if (!stateRef.current.dragging) return;
            map.dragging.enable();
            stateRef.current.dragging = false;
            if (stateRef.current.rect) { stateRef.current.rect.remove(); stateRef.current.rect = null; }
            if (!stateRef.current.startPoint) return;
            const cr = container.getBoundingClientRect();
            const endX = e.clientX - cr.left, endY = e.clientY - cr.top;
            const { x: sx, y: sy } = stateRef.current.startPoint;
            stateRef.current.startPoint = null;
            if (Math.abs(endX - sx) < 10 || Math.abs(endY - sy) < 10) return;
            const tl = map.containerPointToLatLng(L.point(Math.min(sx, endX), Math.min(sy, endY)));
            const br = map.containerPointToLatLng(L.point(Math.max(sx, endX), Math.max(sy, endY)));
            map.fitBounds(L.latLngBounds(tl, br));
        };

        container.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        container.style.cursor = active ? "crosshair" : "";

        return () => {
            container.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            container.style.cursor = "";
            map.dragging.enable();
            if (stateRef.current.rect) { stateRef.current.rect.remove(); stateRef.current.rect = null; }
        };
    }, [map, active]);
};

// ── Measure Tool ──────────────────────────────────────────
const calcDistance = (latlngs) => {
    let total = 0;
    for (let i = 1; i < latlngs.length; i++) total += latlngs[i - 1].distanceTo(latlngs[i]);
    return total;
};

const calcArea = (latlngs) => {
    const R = 6371000; let area = 0; const n = latlngs.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const xi = latlngs[i].lng * Math.PI / 180, yi = latlngs[i].lat * Math.PI / 180;
        const xj = latlngs[j].lng * Math.PI / 180, yj = latlngs[j].lat * Math.PI / 180;
        area += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
    }
    return Math.abs(area * R * R / 2);
};

const fmt = {
    distance: (m) => m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`,
    area:     (m) => m >= 1e6  ? `${(m / 1e6).toFixed(2)} km²` : m >= 1e4 ? `${(m / 1e4).toFixed(2)} ha` : `${Math.round(m)} m²`,
};

const useMeasure = (map) => {
    const [measureMode,   setMeasureMode]   = useState(null);
    const [measureResult, setMeasureResult] = useState(null);
    const stateRef = useRef({ latlngs: [], layers: [], tempLine: null });

    const clearMeasure = () => {
        stateRef.current.layers.forEach((l) => map.removeLayer(l));
        if (stateRef.current.tempLine) map.removeLayer(stateRef.current.tempLine);
        stateRef.current = { latlngs: [], layers: [], tempLine: null };
        setMeasureResult(null);
    };

    const cancelMeasure = () => {
        clearMeasure();
        map.getContainer().style.cursor = "";
        setMeasureMode(null);
    };

    const activateMeasure = (newMode) => {
        if (measureMode) cancelMeasure();
        clearMeasure();
        setMeasureMode(newMode);
        const color = newMode === "distance" ? "#3b82f6" : "#10b981";
        const pts = [];
        map.getContainer().style.cursor = "crosshair";

        const onClick = (e) => {
            pts.push(e.latlng);
            const m = L.circleMarker(e.latlng, { radius: 4, color: "white", fillColor: color, fillOpacity: 1, weight: 2 }).addTo(map);
            stateRef.current.layers.push(m);
            if (pts.length >= 2) {
                const line = L.polyline(pts, { color, weight: 2.5, dashArray: "5,5" }).addTo(map);
                stateRef.current.layers.push(line);
            }
        };

        const onDblClick = (e) => {
            L.DomEvent.stop(e);
            if (newMode === "distance") {
                if (pts.length < 2) { cancelMeasure(); return; }
                setMeasureResult({ type: "distance", value: fmt.distance(calcDistance(pts)) });
            } else {
                if (pts.length < 3) { cancelMeasure(); return; }
                const poly = L.polygon(pts, { color, weight: 2, fillColor: color, fillOpacity: 0.15 }).addTo(map);
                stateRef.current.layers.push(poly);
                setMeasureResult({ type: "area", value: fmt.area(calcArea(pts.map((p) => L.latLng(p.lat, p.lng)))) });
            }
            map.off("click", onClick);
            map.off("dblclick", onDblClick);
            map.off("mousemove", onMouseMove);
            map.getContainer().style.cursor = "";
            setMeasureMode(null);
        };

        const onMouseMove = (e) => {
            if (pts.length === 0) return;
            if (stateRef.current.tempLine) map.removeLayer(stateRef.current.tempLine);
            stateRef.current.tempLine = L.polyline([...pts, e.latlng], { color, weight: 2, dashArray: "4,4", opacity: 0.6 }).addTo(map);
        };

        map.on("click", onClick);
        map.on("dblclick", onDblClick);
        map.on("mousemove", onMouseMove);
    };

    useEffect(() => () => cancelMeasure(), []); // eslint-disable-line

    return { measureMode, measureResult, activateMeasure, cancelMeasure, clearMeasure };
};

// ── MapControls ───────────────────────────────────────────
export const MapControls = () => {
    const map = useMap();
    const [activeTile,    setActiveTile]    = useState("street");
    const [showTileMenu,  setShowTileMenu]  = useState(false);
    const [boxZoomActive, setBoxZoomActive] = useState(false);

    const { measureMode, measureResult, activateMeasure, cancelMeasure, clearMeasure } = useMeasure(map);

    useBoxZoom(map, boxZoomActive);

    // Nonaktifkan box zoom saat mode ukur aktif
    useEffect(() => { if (measureMode) setBoxZoomActive(false); }, [measureMode]);

    return (
        <>
            <TileLayer key={activeTile} url={TILE_LAYERS[activeTile].url} attribution={TILE_LAYERS[activeTile].attribution} maxZoom={18} />

            {/* Hasil pengukuran */}
            {measureResult && (
                <div className="absolute bottom-8 right-16 z-[1000] bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3">
                    <div>
                        <p className="text-xs text-slate-400">{measureResult.type === "distance" ? "📏 Jarak" : "📐 Luas"}</p>
                        <p className="text-xl font-bold text-slate-800">{measureResult.value}</p>
                    </div>
                    <button onClick={clearMeasure} className="text-slate-400 hover:text-rose-500 ml-2 transition-colors">✕</button>
                </div>
            )}

            {/* Hint ukur */}
            {measureMode && (
                <div className="absolute bottom-8 right-16 z-[1000] bg-slate-900/90 text-white text-xs rounded-xl px-3 py-2 backdrop-blur-sm">
                    {measureMode === "distance"
                        ? "📏 Klik titik-titik, double-click selesai"
                        : "📐 Klik titik-titik, double-click tutup area"}
                </div>
            )}

            {/* Hint box zoom */}
            {boxZoomActive && (
                <div className="absolute top-16 right-4 z-[1000] bg-slate-900/90 text-white text-xs rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm">
                    📦 Drag kotak area yang ingin diperbesar
                </div>
            )}

            {/* Kontrol kanan atas */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
                {/* Zoom */}
                {[
                    { icon: Plus,      action: () => map.setZoom(map.getZoom() + 1), title: "Zoom In" },
                    { icon: Minus,     action: () => map.setZoom(map.getZoom() - 1), title: "Zoom Out" },
                    { icon: Crosshair, action: () => map.setView([-2.5, 118.0], 5),  title: "Pusat Indonesia" },
                ].map(({ icon: Icon, action, title }) => (
                    <button key={title} onClick={action} title={title}
                        className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                        <Icon size={15} />
                    </button>
                ))}

                {/* Box Zoom */}
                <button onClick={() => { setBoxZoomActive((p) => !p); if (measureMode) cancelMeasure(); }}
                    title={boxZoomActive ? "Nonaktifkan Zoom Area" : "Zoom Area — drag kotak"}
                    className={`w-9 h-9 backdrop-blur-sm rounded-xl shadow-md border flex items-center justify-center transition-all ${boxZoomActive ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400" : "bg-white/95 border-slate-100 text-slate-600 hover:bg-slate-50"}`}>
                    <Square size={14} />
                </button>

                {/* Separator */}
                <div className="h-px bg-slate-200 mx-1 my-0.5" />

                {/* Ukur Jarak */}
                <button onClick={() => measureMode === "distance" ? cancelMeasure() : (activateMeasure("distance"), setBoxZoomActive(false))}
                    title="Ukur Jarak"
                    className={`w-9 h-9 backdrop-blur-sm rounded-xl shadow-md border flex items-center justify-center transition-all ${measureMode === "distance" ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300" : "bg-white/95 border-slate-100 text-slate-600 hover:bg-slate-50"}`}>
                    <Ruler size={14} />
                </button>

                {/* Ukur Luas */}
                <button onClick={() => measureMode === "area" ? cancelMeasure() : (activateMeasure("area"), setBoxZoomActive(false))}
                    title="Ukur Luas"
                    className={`w-9 h-9 backdrop-blur-sm rounded-xl shadow-md border flex items-center justify-center transition-all ${measureMode === "area" ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300" : "bg-white/95 border-slate-100 text-slate-600 hover:bg-slate-50"}`}>
                    <Square size={13} strokeWidth={1.5} />
                </button>
            </div>

            {/* Tile Switcher */}
            <div className="absolute top-4 right-16 z-[1000]">
                <button onClick={() => setShowTileMenu((p) => !p)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
                    <Layers size={14} />{TILE_LAYERS[activeTile].label}
                </button>
                {showTileMenu && (
                    <div className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden min-w-[140px]">
                        {Object.entries(TILE_LAYERS).map(([key, val]) => (
                            <button key={key} onClick={() => { setActiveTile(key); setShowTileMenu(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${activeTile === key ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700"}`}>
                                {val.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
