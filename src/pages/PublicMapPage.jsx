import { useState, useMemo } from "react";
import { MapView } from "../components/Map/MapView";
import { PublicSidebar } from "../components/Sidebar/PublicSidebar";
import { useJenisObjek } from "../hooks/useJenisObjek";
import { useObjekSpasial } from "../hooks/useObjekSpasial";
import { Map, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const PublicMapPage = () => {
    const { jenisList, loading: jenisLoading } = useJenisObjek();
    const [activeJenisIds, setActiveJenisIds] = useState([]);
    const [showKBAK, setShowKBAK] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuth();

    const { data: objekData, filtered } = useObjekSpasial(activeJenisIds);

    const displayList = useMemo(() => {
        if (!searchQuery) return filtered;
        const q = searchQuery.toLowerCase();
        return filtered.filter((d) => d.nama_objek?.toLowerCase().includes(q) || JSON.stringify(d.atribut)?.toLowerCase().includes(q));
    }, [filtered, searchQuery]);

    // Hitung jumlah objek per jenis
    const objekCount = useMemo(() => {
        const counts = {};
        objekData.forEach((d) => {
            if (d.jenis_id) counts[d.jenis_id] = (counts[d.jenis_id] || 0) + 1;
        });
        return counts;
    }, [objekData]);

    const toggleJenis = (id) => {
        setActiveJenisIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

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
            <MapView objekList={displayList} showKBAK={showKBAK} onToggleKBAK={() => setShowKBAK((p) => !p)} isEditor={!!user} />
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
            />
        </div>
    );
};
