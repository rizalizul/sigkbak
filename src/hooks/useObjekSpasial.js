import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

export const useObjekSpasial = (activeJenisIds = []) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (activeJenisIds.length === 0) {
            setData([]);
            return;
        }

        const fetch = async () => {
            setLoading(true);
            const { data: rows } = await supabase.from("objek_spasial").select("*, jenis_objek(id, nama, warna, ikon)").in("jenis_id", activeJenisIds);
            setData(rows || []);
            setLoading(false);
        };

        fetch();

        const channel = supabase.channel("objek_spasial_changes").on("postgres_changes", { event: "*", schema: "public", table: "objek_spasial" }, fetch).subscribe();
        return () => supabase.removeChannel(channel);
    }, [activeJenisIds.join(",")]); // eslint-disable-line

    const filtered = useMemo(() => {
        if (!searchQuery) return data;
        const q = searchQuery.toLowerCase();
        return data.filter((d) => d.nama_objek?.toLowerCase().includes(q) || JSON.stringify(d.atribut)?.toLowerCase().includes(q));
    }, [data, searchQuery]);

    const createObjek = async (payload) => {
        const { data: newData, error } = await supabase.from("objek_spasial").insert(payload).select("*, jenis_objek(id, nama, warna, ikon)").single();
        if (!error && newData) {
            setData((prev) => [newData, ...prev]); 
        }
        return { error };
    };

    const updateObjek = async (id, payload) => {
        const { data: updatedData, error } = await supabase.from("objek_spasial").update(payload).eq("id", id).select("*, jenis_objek(id, nama, warna, ikon)").single();
        if (!error && updatedData) {
            setData((prev) => prev.map((item) => (item.id === id ? updatedData : item))); 
        }
        return { error };
    };

    const deleteObjek = async (id) => {
        const { error } = await supabase.from("objek_spasial").delete().eq("id", id);
        if (!error) {
            setData((prev) => prev.filter((item) => item.id !== id)); 
        }
        return { error };
    };

    const bulkDeleteObjek = async (ids) => {
        let hasError = null;
        
        // Kita pecah menjadi kelompok 500 ID per request agar URL API Supabase tidak kepanjangan/error
        const chunkSize = 500; 
        const deletePromises = [];

        for (let i = 0; i < ids.length; i += chunkSize) {
            const chunk = ids.slice(i, i + chunkSize);
            // Masukkan antrean perintah hapus 500 data ke dalam array Promise (eksekusi paralel)
            deletePromises.push(supabase.from("objek_spasial").delete().in("id", chunk));
        }

        // Eksekusi semua tembakan API secara bersamaan
        const results = await Promise.all(deletePromises);
        
        results.forEach(res => {
            if (res.error) hasError = res.error;
        });

        if (!hasError) {
            // Bersihkan data dari layar secara instan tanpa perlu reload dari server
            const idSet = new Set(ids);
            setData((prev) => prev.filter((item) => !idSet.has(item.id)));
        }
        
        return { error: hasError };
    };

    return { data, filtered, loading, searchQuery, setSearchQuery, createObjek, deleteObjek, updateObjek, bulkDeleteObjek };
};
