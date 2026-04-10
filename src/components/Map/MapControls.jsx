import { useState } from "react";
import { useMap } from "react-leaflet";
import { TileLayer } from "react-leaflet";
import { Layers, Plus, Minus, Crosshair } from "lucide-react";
import { TILE_LAYERS } from "../../constants/mapConfig";

export const MapControls = () => {
    const map = useMap();
    const [activeTile, setActiveTile] = useState("street");
    const [showTileMenu, setShowTileMenu] = useState(false);

    return (
        <>
            <TileLayer key={activeTile} url={TILE_LAYERS[activeTile].url} attribution={TILE_LAYERS[activeTile].attribution} maxZoom={18} />
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
            </div>
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
