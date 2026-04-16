import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MAP_CONFIG } from "../../constants/mapConfig";
import { X, Check, MapPin } from "lucide-react";
import L from "leaflet";

const pinIcon = L.divIcon({
    html: `<div style="width:28px;height:28px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

const ClickHandler = ({ onPick }) => {
    useMapEvents({ click: (e) => onPick(e.latlng) });
    return null;
};

export const MapPickerModal = ({ initialLat, initialLng, onConfirm, onClose }) => {
    const [picked, setPicked] = useState(initialLat && initialLng ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) } : null);

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-slate-700" />
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">Pilih Lokasi di Peta</p>
                            <p className="text-xs text-slate-400">Klik titik pada peta untuk menentukan koordinat</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100">
                        <X size={16} />
                    </button>
                </div>

                {/* Map */}
                <div style={{ height: "400px", position: "relative" }}>
                    <MapContainer center={picked ? [picked.lat, picked.lng] : MAP_CONFIG.center} zoom={picked ? 12 : MAP_CONFIG.zoom} style={{ width: "100%", height: "100%" }} zoomControl={true}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <ClickHandler onPick={setPicked} />
                        {picked && <Marker position={[picked.lat, picked.lng]} icon={pinIcon} />}
                    </MapContainer>

                    {/* Koordinat overlay */}
                    {picked && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-xl shadow-lg px-4 py-2 text-sm font-mono text-slate-700">
                            {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
                        </div>
                    )}

                    {!picked && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow px-4 py-2 text-sm text-slate-500">👆 Klik di peta untuk memilih lokasi</div>}
                </div>

                {/* Footer */}
                <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                        Batal
                    </button>
                    <button
                        onClick={() => picked && onConfirm(picked.lat, picked.lng)}
                        disabled={!picked}
                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Check size={15} /> Konfirmasi Lokasi
                    </button>
                </div>
            </div>
        </div>
    );
};
