import { useState, useRef, useEffect } from "react";
import { useMap , Marker, Popup, CircleMarker } from "react-leaflet";
import { Search, X, Loader2, MapPin, Navigation } from "lucide-react";
import L from "leaflet";

export const GeoSearch = () => {
    const map = useMap();
    const [query,   setQuery]   = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open,    setOpen]    = useState(false);
    const debounceRef  = useRef(null);
    const containerRef = useRef(null);
    const [myLocation, setMyLocation] = useState(null); // lokasi user

    // Stop map events dari container ini agar tidak trigger zoom/drag
    useEffect(() => {
        if (!containerRef.current) return;
        
        // Disable click dan scroll propagation agar peta tidak bergeser/zoom saat berinteraksi dengan Search Bar
        L.DomEvent.disableClickPropagation(containerRef.current);
        L.DomEvent.disableScrollPropagation(containerRef.current);
        
    }, []);

    // Tutup dropdown saat klik luar
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const search = (q) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q.trim()) { setResults([]); setOpen(false); return; }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const coordMatch = q.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
                if (coordMatch) {
                    const lat = parseFloat(coordMatch[1]);
                    const lng = parseFloat(coordMatch[2]);
                    setResults([{ display_name: `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lon: lng, isCoord: true }]);
                    setOpen(true);
                } else {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=id&accept-language=id`
                    );
                    const data = await res.json();
                    setResults(data);
                    setOpen(data.length > 0);
                }
            } catch (err) { console.error(err); }
            setLoading(false);
        }, 500);
    };

    const handleSelect = (result) => {
        // Cek apakah hasil pencarian memiliki data boundingbox (batas wilayah)
        if (result.boundingbox) {
            // Nominatim memberikan format: [south, north, west, east]
            const [south, north, west, east] = result.boundingbox;
            
            // Buat koordinat batas untuk Leaflet
            const bounds = [
                [parseFloat(south), parseFloat(west)],
                [parseFloat(north), parseFloat(east)]
            ];

            // Gunakan fitBounds agar otomatis zoom-out/in sesuai luas wilayah
            map.fitBounds(bounds, { 
                animate: true, 
                padding: [20, 20], // Beri sedikit ruang di pinggir peta
                duration: 1.5 
            });
        } else {
            // Fallback: Jika tidak ada boundingbox (misal hasil input koordinat manual)
            map.flyTo(
                [parseFloat(result.lat), parseFloat(result.lon)], 
                result.isCoord ? 15 : 13, 
                { animate: true, duration: 1.2 }
            );
        }

        setQuery(result.display_name.split(",")[0]);
        setOpen(false);
    };

    const goToMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation tidak didukung oleh browser Anda");
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = [pos.coords.latitude, pos.coords.longitude];
                setMyLocation(coords); // Simpan lokasi
                map.flyTo(coords, 16, { animate: true }); // Zoom lebih dekat (level 16)
            },
            (err) => {
                console.error(err);
                alert("Gagal mendapatkan lokasi. Pastikan izin GPS aktif.");
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
                        onFocus={() => results.length > 0 && setOpen(true)}
                        placeholder="Cari lokasi di peta..."
                        className="w-full pl-9 pr-8 py-2.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl text-sm placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                    />
                    {loading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
                    {query && !loading && (
                        <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={13} />
                        </button>
                    )}
                </div>
                <button onClick={goToMyLocation} title="Lokasi saya"
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 shadow-md transition-all">
                    <Navigation size={14} />
                </button>
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    {results.map((r, i) => (
                        <button key={i} onClick={() => handleSelect(r)}
                            className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                            <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-sm text-slate-700 font-medium truncate">{r.display_name.split(",")[0]}</p>
                                <p className="text-xs text-slate-400 truncate">{r.display_name.split(",").slice(1, 3).join(",")}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* TAMPILKAN TITIK LOKASI SAYA */}
            {myLocation && (
                <CircleMarker
                    center={myLocation}
                    radius={8}
                    pathOptions={{ 
                        fillColor: '#3b82f6', 
                        color: 'white', 
                        weight: 2, 
                        fillOpacity: 1 
                    }}
                >
                    {/* closeButton={false} untuk membuang tombol X bawaan yang jelek */}
                    <Popup closeButton={false} offset={[0, -5]}>
                        <div className="flex items-center gap-2 px-1 py-0.5">
                            {/* Efek animasi ping (berdenyut) ala GPS */}
                            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                            </span>
                            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                Posisi Anda Saat Ini
                            </span>
                        </div>
                    </Popup>
                </CircleMarker>
            )}
        </div>
    );
};