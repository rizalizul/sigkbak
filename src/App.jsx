import { useState } from "react";
import { MapView } from "./components/Map/MapView";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { useObjekKBAK } from "./hooks/useObjekKBAK";
import { Map, Loader2, AlertCircle } from "lucide-react";

export default function App() {
    const { data, filtered, loading, error, filters, options, toggleFilter, setSearch, resetFilters, activeFilterCount } = useObjekKBAK();
    const [showKBAK, setShowKBAK] = useState(false);

    if (loading)
        return (
            <div style={{ width: "100vw", height: "100vh" }} className="flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center animate-pulse">
                    <Map size={28} className="text-white" />
                </div>
                <div className="text-center">
                    <p className="font-semibold text-slate-800">Memuat SIG KBAK Indonesia</p>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 justify-center">
                        <Loader2 size={13} className="animate-spin" />
                        Mengambil data dari server...
                    </p>
                </div>
            </div>
        );

    if (error)
        return (
            <div style={{ width: "100vw", height: "100vh" }} className="flex items-center justify-center bg-slate-50">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
                    <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
                    <p className="font-semibold text-slate-800">Gagal Memuat Data</p>
                    <p className="text-sm text-slate-500 mt-1">{error}</p>
                </div>
            </div>
        );

    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
            <MapView filtered={filtered} showKBAK={showKBAK} onToggleKBAK={() => setShowKBAK((p) => !p)} />
            <Sidebar filters={filters} filtered={filtered} options={options} toggleFilter={toggleFilter} setSearch={setSearch} resetFilters={resetFilters} activeFilterCount={activeFilterCount} totalCount={data.length} />
        </div>
    );
}
