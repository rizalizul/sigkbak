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

    const [attributeFilters, setAttributeFilters] = useState({
        provinsi: [], kota: [], klasifikasi: [],
    });

    const { data: objekData, filtered } = useObjekSpasial(activeJenisIds);

    // Opsi filter dari data yang sudah di-load
    const attributeOptions = useMemo(() => {
        const provs = new Set();
        const kotas = new Set();
        const klas  = new Set();
        objekData.forEach((obj) => {
            if (obj.atribut?.Provinsi)  provs.add(obj.atribut.Provinsi);
            const namaKota = obj.atribut?.Kab_Kota || obj.atribut?.Kabupaten || obj.atribut?.Kota;
            if (namaKota) kotas.add(namaKota);
            const namaKlas = obj.atribut?.["Klasifikasi Karst"] || obj.atribut?.Jenis || obj.atribut?.Klasifikasi;
            if (namaKlas) klas.add(namaKlas);
        });
        return {
            provinsi:    [...provs].sort(),
            kota:        [...kotas].sort(),
            klasifikasi: [...klas].sort(),
        };
    }, [objekData]);

    const handleToggleAttributeFilter = (category, value) => {
        setAttributeFilters((prev) => {
            const current = prev[category];
            return {
                ...prev,
                [category]: current.includes(value)
                    ? current.filter((item) => item !== value)
                    : [...current, value],
            };
        });
    };

    // Terapkan filter atribut ke data
    const displayList = useMemo(() => {
        return filtered.filter((d) => {
            const matchProvinsi = attributeFilters.provinsi.length === 0 ||
                attributeFilters.provinsi.includes(d.atribut?.Provinsi);

            const namaKota = d.atribut?.Kab_Kota || d.atribut?.Kabupaten || d.atribut?.Kota;
            const matchKota = attributeFilters.kota.length === 0 ||
                attributeFilters.kota.includes(namaKota);

            const namaKlas = d.atribut?.["Klasifikasi Karst"] || d.atribut?.Jenis || d.atribut?.Klasifikasi;
            const matchKlas = attributeFilters.klasifikasi.length === 0 ||
                attributeFilters.klasifikasi.includes(namaKlas);

            return matchProvinsi && matchKota && matchKlas;
        });
    }, [filtered, attributeFilters]);

    const objekCount = useMemo(() => {
        const counts = {};
        objekData.forEach((d) => {
            if (d.jenis_id) counts[d.jenis_id] = (counts[d.jenis_id] || 0) + 1;
        });
        return counts;
    }, [objekData]);

    const toggleJenis = (id) =>
        setActiveJenisIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    if (jenisLoading) return (
        <div style={{ width: "100vw", height: "100vh" }}
            className="flex flex-col items-center justify-center bg-slate-50 gap-4">
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
