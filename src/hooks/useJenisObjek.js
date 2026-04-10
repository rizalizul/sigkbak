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
        return { data, error };
    };

    const updateJenis = async (id, payload) => {
        const { error } = await supabase.from("jenis_objek").update(payload).eq("id", id);
        return { error };
    };

    const deleteJenis = async (id) => {
        const { error } = await supabase.from("jenis_objek").delete().eq("id", id);
        return { error };
    };

    return { jenisList, loading, createJenis, updateJenis, deleteJenis, refetch: fetch };
};
