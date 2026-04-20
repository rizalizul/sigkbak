import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";

let _counter = 0;
const genId = () => `preview_${++_counter}_${Date.now()}`;

// Hitung jarak dalam meter antara dua koordinat (Haversine)
const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DUPLICATE_RADIUS_M = 50; // dalam 50 meter dianggap lokasi mirip

export const usePreview = () => {
    const [items, setItems] = useState([]);
    const [savingAll, setSavingAll] = useState(false);
    const [duplicateMap, setDuplicateMap] = useState({}); // { _id: [{nama, koordinat}] }

    const addItems = useCallback((newItems, jenisId) => {
        setItems((prev) => [...prev, ...newItems.map((item) => ({ ...item, _id: genId(), _status: "pending", _jenisId: jenisId }))]);
    }, []);

    // Cek duplikat ke Supabase setiap kali items berubah
    useEffect(() => {
        const pendingItems = items.filter((i) => i._status === "pending" && i.nama_objek);
        if (pendingItems.length === 0) {
            setDuplicateMap({});
            return;
        }

        const checkDuplicates = async () => {
            // Ambil semua nama yang mirip
            const names = [...new Set(pendingItems.map((i) => i.nama_objek.toLowerCase().trim()))];

            const { data: existing } = await supabase
                .from("objek_spasial")
                .select("id, nama_objek, koordinat_x, koordinat_y")
                .or(names.map((n) => `nama_objek.ilike.%${n}%`).join(","));

            if (!existing || existing.length === 0) {
                setDuplicateMap({});
                return;
            }

            const newMap = {};
            pendingItems.forEach((item) => {
                const nameLower = item.nama_objek?.toLowerCase().trim() ?? "";
                const matches = existing.filter((ex) => {
                    // Cek kemiripan nama
                    const exName = ex.nama_objek?.toLowerCase().trim() ?? "";
                    const nameSimilar = exName.includes(nameLower) || nameLower.includes(exName);
                    if (!nameSimilar) return false;

                    // Cek jarak koordinat jika ada
                    if (item.koordinat_x && item.koordinat_y && ex.koordinat_x && ex.koordinat_y) {
                        const dist = haversineMeters(parseFloat(item.koordinat_y), parseFloat(item.koordinat_x), parseFloat(ex.koordinat_y), parseFloat(ex.koordinat_x));
                        return dist <= DUPLICATE_RADIUS_M;
                    }

                    // Kalau tidak ada koordinat, cukup nama mirip
                    return nameSimilar;
                });

                if (matches.length > 0) newMap[item._id] = matches;
            });

            setDuplicateMap(newMap);
        };

        checkDuplicates();
    }, [items]);

    const updateItem = useCallback((id, updated) => {
        setItems((prev) => prev.map((i) => (i._id === id ? { ...i, ...updated } : i)));
    }, []);

    const discardItem = useCallback((id) => setItems((prev) => prev.filter((i) => i._id !== id)), []);
    const discardAll = useCallback(() => {
        setItems([]);
        setDuplicateMap({});
    }, []);
    const clearSaved = useCallback(() => setItems((prev) => prev.filter((i) => i._status !== "saved")), []);

    const saveItem = useCallback(
        async (id) => {
            setItems((prev) => prev.map((i) => (i._id === id ? { ...i, _status: "saving" } : i)));
            const item = items.find((i) => i._id === id);
            if (!item) return;
            const { _id, _status, _jenisId, error: itemError, ...data } = item;
            const { error } = await supabase.from("objek_spasial").insert({ ...data, jenis_id: _jenisId });
            setItems((prev) => prev.map((i) => (i._id === id ? { ...i, _status: error ? "error" : "saved" } : i)));
        },
        [items],
    );

    const saveAll = useCallback(async () => {
        setSavingAll(true);
        const pending = items.filter((i) => i._status === "pending");
        for (const item of pending) {
            setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, _status: "saving" } : i)));
            const { _id, _status, _jenisId, error: itemError, ...data } = item;
            const { error } = await supabase.from("objek_spasial").insert({ ...data, jenis_id: _jenisId });
            setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, _status: error ? "error" : "saved" } : i)));
        }
        setSavingAll(false);
    }, [items]);

    return { items, addItems, updateItem, discardItem, discardAll, clearSaved, saveItem, saveAll, savingAll, duplicateMap };
};
