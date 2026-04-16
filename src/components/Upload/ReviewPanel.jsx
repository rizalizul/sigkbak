import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { ChevronDown, ChevronUp, Save, Trash2, Loader2, CheckCheck, Pencil, X, Check, AlertTriangle, MapPin } from "lucide-react";

const StatusBadge = ({ status }) => {
    const map = { pending: "bg-amber-100 text-amber-700", saving: "bg-blue-100 text-blue-700", saved: "bg-green-100 text-green-700", error: "bg-rose-100 text-rose-700" };
    const label = { pending: "Menunggu", saving: "Menyimpan...", saved: "Tersimpan", error: "Error" };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-lg flex-shrink-0 ${map[status]}`}>{label[status]}</span>;
};

const DuplicateWarning = ({ matches }) => (
    <div className="px-3 py-2 bg-amber-50 border-t border-amber-200">
        <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-xs font-semibold text-amber-700">Kemungkinan duplikat!</p>
                <p className="text-xs text-amber-600 mt-0.5">Data serupa ditemukan di database:</p>
                {matches.slice(0, 2).map((m) => (
                    <p key={m.id} className="text-xs text-amber-700 font-medium mt-0.5">
                        • {m.nama_objek}
                        {m.koordinat_y && ` (${parseFloat(m.koordinat_y).toFixed(4)}, ${parseFloat(m.koordinat_x).toFixed(4)})`}
                    </p>
                ))}
                <p className="text-xs text-amber-500 mt-1">Kamu tetap bisa menyimpan jika memang berbeda.</p>
            </div>
        </div>
    </div>
);

const draggableIcon = L.divIcon({
    html: `<div style="width:28px;height:28px;background:#3b82f6;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

const ClickToMove = ({ onMove }) => {
    useMapEvents({ click: (e) => onMove(e.latlng.lat, e.latlng.lng) });
    return null;
};

const InlineMap = ({ lat, lng, onMove }) => {
    const validLat = !isNaN(parseFloat(lat)) ? parseFloat(lat) : -2.5;
    const validLng = !isNaN(parseFloat(lng)) ? parseFloat(lng) : 118.0;

    return (
        <div className="rounded-xl overflow-hidden border border-blue-200 mt-2" style={{ height: "200px" }}>
            <MapContainer key={`${validLat}-${validLng}`} center={[validLat, validLng]} zoom={13} style={{ width: "100%", height: "100%" }} zoomControl={true} scrollWheelZoom={true}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickToMove onMove={onMove} />
                <Marker
                    position={[validLat, validLng]}
                    icon={draggableIcon}
                    draggable={true}
                    eventHandlers={{
                        dragend: (e) => {
                            const { lat: newLat, lng: newLng } = e.target.getLatLng();
                            onMove(newLat, newLng);
                        },
                    }}
                />
            </MapContainer>
            <p className="text-xs text-center text-blue-600 bg-blue-50 py-1">🔵 Drag marker atau klik peta untuk pindah titik</p>
        </div>
    );
};

const InlineEditForm = ({ item, onSave, onCancel }) => {
    const [nama, setNama] = useState(item.nama_objek || "");
    const [x, setX] = useState(item.koordinat_x ?? "");
    const [y, setY] = useState(item.koordinat_y ?? "");
    const [entries, setEntries] = useState(() => Object.entries(item.atribut || {}));
    const [showMap, setShowMap] = useState(false);

    const updateEntries = (next) => setEntries(next);
    const setKey = (idx, key) => {
        const n = [...entries];
        n[idx] = [key, n[idx][1]];
        updateEntries(n);
    };
    const setVal = (idx, val) => {
        const n = [...entries];
        n[idx] = [n[idx][0], val];
        updateEntries(n);
    };
    const removeEntry = (idx) => updateEntries(entries.filter((_, i) => i !== idx));
    const addEntry = () => updateEntries([...entries, ["", ""]]);

    const hasCoords = !isNaN(parseFloat(x)) && !isNaN(parseFloat(y));

    // Saat marker digeser atau peta diklik → update input koordinat
    const handleMapMove = (newLat, newLng) => {
        setY(newLat.toFixed(8));
        setX(newLng.toFixed(8));
    };

    const handleSave = () => {
        const atribut = Object.fromEntries(entries.filter(([k]) => k.trim() !== ""));
        onSave({
            nama_objek: nama,
            koordinat_x: parseFloat(x) || null,
            koordinat_y: parseFloat(y) || null,
            atribut,
        });
    };

    return (
        <div className="px-3 pb-3 pt-2 bg-blue-50 border-t border-blue-100 space-y-3">
            <p className="text-xs font-semibold text-blue-800">✏️ Edit sebelum simpan</p>

            <div>
                <label className="block text-xs text-slate-500 mb-1">Nama Objek</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white" />
            </div>

            {/* Koordinat + tombol peta */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-500">Koordinat</label>
                    <button type="button" onClick={() => setShowMap((p) => !p)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        <MapPin size={11} />
                        {showMap ? "Sembunyikan Peta" : hasCoords ? "Edit di Peta" : "Pilih dari Peta"}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Longitude (X)</label>
                        <input
                            type="number"
                            step="any"
                            value={x}
                            onChange={(e) => setX(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Latitude (Y)</label>
                        <input
                            type="number"
                            step="any"
                            value={y}
                            onChange={(e) => setY(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                        />
                    </div>
                </div>

                {/* Inline map */}
                {showMap && <InlineMap lat={y || -2.5} lng={x || 118.0} onMove={handleMapMove} />}
            </div>

            {/* Atribut */}
            <div>
                <label className="block text-xs text-slate-500 mb-2">Atribut</label>
                <div className="space-y-1.5">
                    {entries.map(([k, v], idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                            <input value={k} onChange={(e) => setKey(idx, e.target.value)} placeholder="Field" className="w-2/5 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white" />
                            <span className="text-slate-300 text-xs">:</span>
                            <input value={String(v ?? "")} onChange={(e) => setVal(idx, e.target.value)} placeholder="Nilai" className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white" />
                            <button onClick={() => removeEntry(idx)} className="text-slate-400 hover:text-rose-500">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <button onClick={addEntry} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mt-1">
                        + Tambah Atribut
                    </button>
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={onCancel} className="flex-1 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-white transition-colors">
                    Batal
                </button>
                <button onClick={handleSave} className="flex-1 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-medium hover:bg-blue-800 transition-colors flex items-center justify-center gap-1">
                    <Check size={12} /> Terapkan
                </button>
            </div>
        </div>
    );
};

const ReviewItem = ({ item, onSave, onDiscard, onUpdate, duplicates }) => {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);

    const atributEntries = item.atribut ? Object.entries(item.atribut).filter(([, v]) => v != null && v !== "" && v !== "null") : [];

    const handleUpdate = (updated) => {
        onUpdate(item._id, updated);
        setEditing(false);
    };
    const hasDuplicate = duplicates && duplicates.length > 0;

    return (
        <div className={`border rounded-xl overflow-hidden mb-2 transition-opacity ${item._status === "saved" ? "opacity-40" : ""} ${hasDuplicate && item._status === "pending" ? "border-amber-300" : "border-slate-200"}`}>
            {/* Header */}
            <div className={`flex items-center gap-2 px-3 py-2.5 ${hasDuplicate && item._status === "pending" ? "bg-amber-50" : "bg-slate-50"}`}>
                <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                        setExpanded((p) => !p);
                        setEditing(false);
                    }}
                >
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.nama_objek || "Tanpa Nama"}</p>
                        {hasDuplicate && item._status === "pending" && <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400">{item.koordinat_x && item.koordinat_y ? `${parseFloat(item.koordinat_y).toFixed(5)}, ${parseFloat(item.koordinat_x).toFixed(5)}` : "Koordinat tidak tersedia"}</p>
                </div>
                <StatusBadge status={item._status} />
                {item._status === "pending" && (
                    <button
                        onClick={() => {
                            setEditing((p) => !p);
                            setExpanded(false);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors ml-1"
                    >
                        <Pencil size={12} />
                    </button>
                )}
                <button
                    onClick={() => {
                        setExpanded((p) => !p);
                        setEditing(false);
                    }}
                    className="text-slate-400 ml-1"
                >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Duplicate warning */}
            {hasDuplicate && item._status === "pending" && !editing && <DuplicateWarning matches={duplicates} />}

            {/* Expanded detail */}
            {expanded && !editing && atributEntries.length > 0 && (
                <div className="px-3 py-2.5 border-t border-slate-100 bg-white grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {atributEntries.map(([k, v]) => (
                        <div key={k}>
                            <p className="text-xs text-slate-400">{k.replace(/_/g, " ")}</p>
                            <p className="text-xs font-medium text-slate-700 truncate">{String(v)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Inline edit */}
            {editing && <InlineEditForm item={item} onSave={handleUpdate} onCancel={() => setEditing(false)} />}

            {/* Actions */}
            {item._status === "pending" && !editing && (
                <div className="flex gap-1.5 px-3 py-2 border-t border-slate-100 bg-white">
                    <button onClick={() => onSave(item._id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">
                        <Save size={11} /> Simpan
                    </button>
                    <button
                        onClick={() => onDiscard(item._id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                    >
                        <Trash2 size={11} /> Buang
                    </button>
                </div>
            )}
            {item._status === "saving" && (
                <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-slate-100 text-xs text-blue-600">
                    <Loader2 size={11} className="animate-spin" /> Menyimpan...
                </div>
            )}
        </div>
    );
};

export const ReviewPanel = ({ items, onSave, onDiscard, onSaveAll, onDiscardAll, onClearSaved, onUpdate, savingAll, duplicateMap = {} }) => {
    const pending = items.filter((i) => i._status === "pending").length;
    const saved = items.filter((i) => i._status === "saved").length;
    const error = items.filter((i) => i._status === "error").length;
    const dupCount = Object.keys(duplicateMap).length;

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-amber-700">{pending}</p>
                    <p className="text-xs text-amber-600">Menunggu</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-green-700">{saved}</p>
                    <p className="text-xs text-green-600">Tersimpan</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-rose-700">{error}</p>
                    <p className="text-xs text-rose-600">Error</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-orange-700">{dupCount}</p>
                    <p className="text-xs text-orange-600">Duplikat?</p>
                </div>
            </div>

            {dupCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                        <span className="font-semibold">{dupCount} objek</span> terdeteksi mirip dengan data yang sudah ada di database. Periksa sebelum menyimpan.
                    </p>
                </div>
            )}

            {/* Bulk actions */}
            <div className="flex gap-1.5 flex-wrap">
                {pending > 0 && (
                    <button
                        onClick={onSaveAll}
                        disabled={savingAll}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors disabled:opacity-60"
                    >
                        {savingAll ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                        Simpan Semua ({pending})
                    </button>
                )}
                {saved > 0 && (
                    <button onClick={onClearSaved} className="py-2 px-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors whitespace-nowrap">
                        Hapus Tersimpan
                    </button>
                )}
                <button onClick={onDiscardAll} className="py-2 px-3 border border-rose-200 text-rose-500 rounded-xl text-xs font-medium hover:bg-rose-50 transition-colors whitespace-nowrap">
                    Buang Semua
                </button>
            </div>

            {/* List */}
            <div className="max-h-[520px] overflow-y-auto sidebar-scroll space-y-0">
                {items.map((item) => (
                    <ReviewItem key={item._id} item={item} onSave={onSave} onDiscard={onDiscard} onUpdate={onUpdate} duplicates={duplicateMap[item._id]} />
                ))}
            </div>
        </div>
    );
};
