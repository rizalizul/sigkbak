import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

export const useObjekKBAK = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        klasifikasi: [],
        provinsi: [],
        searchQuery: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: rows, error: err } = await supabase.from("objek_kbak").select("*").order("nama_objek");

            if (err) {
                setError(err.message);
                setLoading(false);
                return;
            }
            setData(rows || []);
            setLoading(false);
        };

        fetchData();

        // Realtime subscription
        const channel = supabase.channel("objek_kbak_changes").on("postgres_changes", { event: "*", schema: "public", table: "objek_kbak" }, fetchData).subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const options = useMemo(
        () => ({
            klasifikasi: [...new Set(data.map((d) => d.klasifikasi_karst).filter(Boolean))].sort(),
            provinsi: [...new Set(data.map((d) => d.provinsi).filter(Boolean))].sort(),
        }),
        [data],
    );

    const filtered = useMemo(() => {
        return data.filter((d) => {
            const matchKlas = filters.klasifikasi.length === 0 || filters.klasifikasi.includes(d.klasifikasi_karst);
            const matchProv = filters.provinsi.length === 0 || filters.provinsi.includes(d.provinsi);
            const q = filters.searchQuery.toLowerCase();
            const matchSearch = !q || d.nama_objek?.toLowerCase().includes(q) || d.kab_kota?.toLowerCase().includes(q) || d.provinsi?.toLowerCase().includes(q) || d.kode?.toLowerCase().includes(q);
            return matchKlas && matchProv && matchSearch;
        });
    }, [data, filters]);

    const toggleFilter = (key, value) => {
        setFilters((prev) => {
            const arr = prev[key];
            return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
        });
    };

    const setSearch = (q) => setFilters((prev) => ({ ...prev, searchQuery: q }));
    const resetFilters = () => setFilters({ klasifikasi: [], provinsi: [], searchQuery: "" });
    const activeFilterCount = filters.klasifikasi.length + filters.provinsi.length + (filters.searchQuery ? 1 : 0);

    return { data, filtered, loading, error, filters, options, toggleFilter, setSearch, resetFilters, activeFilterCount };
};
