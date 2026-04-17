import { useState, useRef, useEffect } from "react";
import { useMap } from "react-leaflet";
import { Search, X, Loader2, MapPin, Navigation } from "lucide-react";

export const GeoSearch = () => {
    const map = useMap();
    const [query,   setQuery]   = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open,    setOpen]    = useState(false);
    const debounceRef  = useRef(null);
    const containerRef = useRef(null);

    // Stop map events dari container ini agar tidak trigger zoom/drag
    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const stop = (e) => e.stopPropagation();
        ["mousedown","mousemove","mouseup","click","dblclick","wheel","touchstart","touchmove","touchend"].forEach((ev) => {
            el.addEventListener(ev, stop);
        });
        return () => {
            ["mousedown","mousemove","mouseup","click","dblclick","wheel","touchstart","touchmove","touchend"].forEach((ev) => {
                el.removeEventListener(ev, stop);
            });
        };
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
        map.flyTo([parseFloat(result.lat), parseFloat(result.lon)], result.isCoord ? 15 : 13, { animate: true, duration: 1.2 });
        setQuery(result.display_name.split(",")[0]);
        setOpen(false);
    };

    const goToMyLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { animate: true }),
            (err) => console.error(err)
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
        </div>
    );
};