import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const useJenisObjek = () => {
    const [jenisList, setJenisList] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        const { data } = await supabase.from("jenis_objek").select("*").order("nama");
        setJenisList(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetch();
        const channel = supabase.channel("jenis_objek_changes").on("postgres_changes", { event: "*", schema: "public", table: "jenis_objek" }, fetch).subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    const createJenis = async (payload) => {
        const { data, error } = await supabase.from("jenis_objek").insert(payload).select().single();
        if (!error && data) {
            // Langsung tambahkan ke layar dan urutkan abjad
            setJenisList((prev) => [...prev, data].sort((a, b) => a.nama.localeCompare(b.nama)));
        }
        return { data, error };
    };

    const updateJenis = async (id, payload) => {
        const { data, error } = await supabase.from("jenis_objek").update(payload).eq("id", id).select().single();
        if (!error && data) {
            // Langsung ubah data yang cocok di layar
            setJenisList((prev) => prev.map((item) => (item.id === id ? data : item)).sort((a, b) => a.nama.localeCompare(b.nama)));
        }
        return { error };
    };

    const deleteJenis = async (id) => {
        const { error } = await supabase.from("jenis_objek").delete().eq("id", id);
        if (!error) {
            // Langsung buang data dari layar
            setJenisList((prev) => prev.filter((item) => item.id !== id));
        }
        return { error };
    };

    return { jenisList, loading, createJenis, updateJenis, deleteJenis, refetch: fetch };
};
