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

    // Create Optimistic
    const createObjek = async (payload) => {
        const { data: newData, error } = await supabase.from("objek_spasial").insert(payload).select("*, jenis_objek(id, nama, warna, ikon)").single();
        if (!error && newData) {
            setData((prev) => [newData, ...prev]); // Langsung taruh di paling atas
        }
        return { error };
    };

    const updateObjek = async (id, payload) => {
        const { data: updatedData, error } = await supabase.from("objek_spasial").update(payload).eq("id", id).select("*, jenis_objek(id, nama, warna, ikon)").single();
        if (!error && updatedData) {
            setData((prev) => prev.map((item) => (item.id === id ? updatedData : item))); // Langsung update barisnya
        }
        return { error };
    };

    const deleteObjek = async (id) => {
        const { error } = await supabase.from("objek_spasial").delete().eq("id", id);
        if (!error) {
            setData((prev) => prev.filter((item) => item.id !== id)); // Langsung hilangkan dari layar
        }
        return { error };
    };

    return { data, filtered, loading, searchQuery, setSearchQuery, createObjek, deleteObjek, updateObjek };
};
