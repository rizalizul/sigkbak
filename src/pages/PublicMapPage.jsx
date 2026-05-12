import { useState, useMemo } from "react";
import { MapView }         from "../components/Map/MapView";
import { PublicSidebar }   from "../components/Sidebar/PublicSidebar";
import { useJenisObjek }   from "../hooks/useJenisObjek";
import { useObjekSpasial } from "../hooks/useObjekSpasial";
import { useAuth }         from "../hooks/useAuth";
import { useInitialView }  from "../components/Map/PermalinkSync";
import { Map, Loader2 }    from "lucide-react";

export const PublicMapPage = () => {
    const { jenisList, loading: jenisLoading } = useJenisObjek();
    const { user }    = useAuth();
    const initialView = useInitialView();

    const [activeJenisIds, setActiveJenisIds] = useState([]);
    const [showKBAK,       setShowKBAK]       = useState(false);
    const [searchQuery,    setSearchQuery]    = useState("");

    const [attributeFilters, setAttributeFilters] = useState({
        provinsi: [],
        kota: [],
        klasifikasi: []
    });

    const { data: objekData, filtered } = useObjekSpasial(activeJenisIds);

    const attributeOptions = useMemo(() => {
        const provs = new Set();
        const kotas = new Set();
        const klas = new Set();
        
        objekData.forEach(obj => {
            if (obj.atribut?.Provinsi) provs.add(obj.atribut.Provinsi);
            
            // 🌟 Membaca Kab_Kota sesuai format Excel Anda
            const namaKota = obj.atribut?.Kab_Kota || obj.atribut?.Kabupaten || obj.atribut?.Kota;
            if (namaKota) kotas.add(namaKota);
            
            // 🌟 Membaca Klasifikasi Karst atau Jenis
            const namaKlasifikasi = obj.atribut?.['Klasifikasi Karst'] || obj.atribut?.Jenis || obj.atribut?.Klasifikasi;
            if (namaKlasifikasi) klas.add(namaKlasifikasi);
        });
        
        return { 
            provinsi: [...provs].sort(), 
            kota: [...kotas].sort(), 
            klasifikasi: [...klas].sort() 
        };
    }, [objekData]);

    // Fungsi Toggle Filter Atribut
    const handleToggleAttributeFilter = (category, value) => {
        setAttributeFilters(prev => {
            const current = prev[category];
            const next = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [category]: next };
        });
    };

    // Terapkan Filter Search DAN Filter Atribut ke Data Peta
    const displayList = useMemo(() => {
        return filtered.filter((d) => {
            let matchSearch = true;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                matchSearch = d.nama_objek?.toLowerCase().includes(q) || JSON.stringify(d.atribut)?.toLowerCase().includes(q);
            }

            const matchProvinsi = attributeFilters.provinsi.length === 0 || 
                                  attributeFilters.provinsi.includes(d.atribut?.Provinsi);
            
            const namaKotaD = d.atribut?.Kab_Kota || d.atribut?.Kabupaten || d.atribut?.Kota;
            const matchKota = attributeFilters.kota.length === 0 || 
                              attributeFilters.kota.includes(namaKotaD);

            const namaKlasD = d.atribut?.['Klasifikasi Karst'] || d.atribut?.Jenis || d.atribut?.Klasifikasi;
            const matchKlasifikasi = attributeFilters.klasifikasi.length === 0 || 
                                     attributeFilters.klasifikasi.includes(namaKlasD);

            return matchSearch && matchProvinsi && matchKota && matchKlasifikasi;
        });
    }, [filtered, searchQuery, attributeFilters]);

    const objekCount = useMemo(() => {
        const counts = {};
        objekData.forEach((d) => {
            if (d.jenis_id) counts[d.jenis_id] = (counts[d.jenis_id] || 0) + 1;
        });
        return counts;
    }, [objekData]);

    const toggleJenis = (id) =>
        setActiveJenisIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    if (jenisLoading)
        return (
            <div style={{ width: "100vw", height: "100vh" }} className="flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center animate-pulse">
                    <Map size={28} className="text-white" />
                </div>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin" /> Memuat SIG KBAK Indonesia...
                </p>
            </div>
        );

    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
            <MapView
                objekList={displayList}
                showKBAK={showKBAK}
                onToggleKBAK={() => setShowKBAK((p) => !p)}
                isEditor={!!user}
                initialView={initialView}
            />
            <PublicSidebar
                jenisList={jenisList}
                activeJenisIds={activeJenisIds}
                onToggleJenis={toggleJenis}
                showKBAK={showKBAK}
                onToggleKBAK={() => setShowKBAK((p) => !p)}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                totalObjek={objekData.length}
                filteredObjek={displayList.length}
                objekCount={objekCount}
                user={user}
                
                attributeFilters={attributeFilters}
                attributeOptions={attributeOptions}
                onToggleAttributeFilter={handleToggleAttributeFilter}
            />
        </div>
    );
};
