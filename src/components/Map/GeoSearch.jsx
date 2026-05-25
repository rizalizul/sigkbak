import { useState, useRef, useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import { Search, X, Loader2, MapPin, Database } from "lucide-react";
import L from "leaflet";
import { supabase } from "../../lib/supabase";

export const GeoSearch = () => {
    const map = useMap();
    const [query,       setQuery]      = useState("");
    const [geoResults, setGeoResults] = useState([]);
    const [objResults, setObjResults] = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [open,       setOpen]       = useState(false);
    const debounceRef  = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        L.DomEvent.disableClickPropagation(containerRef.current);
        L.DomEvent.disableScrollPropagation(containerRef.current);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Search objek dari Supabase
    const searchObjek = useCallback(async (q) => {
        if (!q.trim()) return [];
        const { data } = await supabase
            .from("objek_spasial")
            .select("id, nama_objek, koordinat_x, koordinat_y, jenis_objek(nama, warna, ikon)")
            .ilike("nama_objek", `%${q}%`)
            .not("koordinat_x", "is", null)
            .not("koordinat_y", "is", null)
            .limit(5);
        return data || [];
    }, []);

    // Search lokasi dari Nominatim
    const searchGeo = useCallback(async (q) => {
        if (!q.trim()) return [];
        const coordMatch = q.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
        if (coordMatch) {
            return [{
                display_name: `Koordinat: ${parseFloat(coordMatch[1]).toFixed(5)}, ${parseFloat(coordMatch[2]).toFixed(5)}`,
                lat: coordMatch[1], lon: coordMatch[2], isCoord: true,
            }];
        }
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=4&countrycodes=id&accept-language=id`
            );
            return await res.json();
        } catch { return []; }
    }, []);

    const doSearch = useCallback((q) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q.trim()) { setGeoResults([]); setObjResults([]); setOpen(false); return; }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            // Jalankan keduanya paralel
            const [objs, geos] = await Promise.all([searchObjek(q), searchGeo(q)]);
            setObjResults(objs);
            setGeoResults(geos);
            setOpen(objs.length > 0 || geos.length > 0);
            setLoading(false);
        }, 400);
    }, [searchObjek, searchGeo]);

    const handleChange = (e) => {
        setQuery(e.target.value);
        doSearch(e.target.value);
    };

    // Enter → fly ke hasil pertama (objek dulu, fallback geo)
    const handleKeyDown = async (e) => {
        if (e.key !== "Enter" || !query.trim()) return;
        e.preventDefault();
        setLoading(true);

        // Prioritas: objek dulu
        if (objResults.length > 0) {
            flyToObjek(objResults[0]);
            setLoading(false);
            return;
        }

        // Fallback: Nominatim
        let geos = geoResults;
        if (geos.length === 0) geos = await searchGeo(query);
        if (geos.length > 0) flyToGeo(geos[0]);
        setLoading(false);
        setOpen(false);
    };

    const flyToObjek = (obj) => {
        const lat = parseFloat(obj.koordinat_y);
        const lng = parseFloat(obj.koordinat_x);
        if (!isNaN(lat) && !isNaN(lng)) {
            map.flyTo([lat, lng], 15, { animate: true, duration: 1.2 });
        }
        setQuery(obj.nama_objek || "");
        setOpen(false);
    };

    const flyToGeo = (result) => {
        if (result.boundingbox) {
            const [s, n, w, e] = result.boundingbox;
            map.fitBounds([[+s, +w], [+n, +e]], { animate: true, padding: [20, 20] });
        } else {
            map.flyTo([+result.lat, +result.lon], result.isCoord ? 15 : 13, { animate: true, duration: 1.2 });
        }
        setQuery(result.display_name.split(",")[0]);
        setOpen(false);
    };

    const clear = () => { setQuery(""); setGeoResults([]); setObjResults([]); setOpen(false); };

    const hasResults = objResults.length > 0 || geoResults.length > 0;

    return (
        <div ref={containerRef} className="relative">
            <div className="relative w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => hasResults && setOpen(true)}
                    placeholder="Cari objek atau lokasi..."
                    className="w-full pl-9 pr-8 py-2.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl text-sm placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                {loading
                    ? <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                    : query && <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>
                }
            </div>

            {/* Dropdown hasil */}
            {open && hasResults && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">

                    {/* Hasil objek */}
                    {objResults.length > 0 && (
                        <>
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
                                <Database size={11} className="text-emerald-600" />
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Objek di Database</span>
                            </div>
                            {objResults.map((obj) => (
                                <button key={obj.id} onClick={() => flyToObjek(obj)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0">
                                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs border-2 border-white shadow-sm overflow-hidden"
                                        style={{ backgroundColor: obj.jenis_objek?.warna === "transparent" ? "transparent" : (obj.jenis_objek?.warna || "#6b7280") }}>
                                        {(() => {
                                            const ikon = obj.jenis_objek?.ikon;
                                            if (!ikon) return "📍";
                                            const isImage = ikon.startsWith("http") || ikon.includes("/");
                                            return isImage
                                                ? <img src={ikon} alt="ikon" className="w-full h-full object-contain p-0.5" />
                                                : <span>{ikon}</span>;
                                        })()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-slate-800 font-medium truncate">{obj.nama_objek}</p>
                                        <p className="text-xs text-slate-400 truncate">{obj.jenis_objek?.nama || "—"}</p>
                                    </div>
                                    <MapPin size={12} className="text-emerald-400 flex-shrink-0" />
                                </button>
                            ))}
                        </>
                    )}

                    {/* Hasil lokasi Nominatim */}
                    {geoResults.length > 0 && (
                        <>
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 border-t flex items-center gap-1.5">
                                <MapPin size={11} className="text-blue-500" />
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lokasi di Peta</span>
                            </div>
                            {geoResults.map((r, i) => (
                                <button key={i} onClick={() => flyToGeo(r)}
                                    className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                                    <MapPin size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-sm text-slate-700 font-medium truncate">{r.display_name.split(",")[0]}</p>
                                        <p className="text-xs text-slate-400 truncate">{r.display_name.split(",").slice(1, 3).join(",")}</p>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}

                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Tekan <kbd className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">Enter</kbd> untuk hasil teratas</p>
                    </div>
                </div>
            )}
        </div>
    );
};