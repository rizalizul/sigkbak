import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Loader2, User, RefreshCw, Shield } from "lucide-react";

export const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [saving,   setSaving]   = useState(null);

    const fetchProfiles = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
        setProfiles(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchProfiles(); }, []);

    const toggleActive = async (profile) => {
        if (profile.id === currentUser?.id) {
            alert("Tidak bisa menonaktifkan akun sendiri.");
            return;
        }
        setSaving(profile.id);
        const { error } = await supabase
            .from("profiles")
            .update({ is_active: !profile.is_active })
            .eq("id", profile.id);
        if (!error) setProfiles((prev) => prev.map((p) => p.id === profile.id ? { ...p, is_active: !p.is_active } : p));
        setSaving(null);
    };

    const formatDate = (str) => new Date(str).toLocaleDateString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
    });

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Manajemen User</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Kelola akun editor yang terdaftar</p>
                </div>
                <button onClick={fetchProfiles}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                ⚠️ Menonaktifkan user hanya menandai status di sistem ini. Untuk menghapus akun sepenuhnya, gunakan dashboard Supabase → Authentication.
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                        <Loader2 size={18} className="animate-spin" /> Memuat users...
                    </div>
                ) : profiles.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">Belum ada user terdaftar.</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">User</th>
                                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Bergabung</th>
                                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Status</th>
                                <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {profiles.map((profile) => {
                                const isCurrentUser = profile.id === currentUser?.id;
                                return (
                                    <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
                                                    {profile.email?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">
                                                        {profile.email}
                                                        {isCurrentUser && (
                                                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-lg font-medium">Saya</span>
                                                        )}
                                                    </p>
                                                    {profile.full_name && (
                                                        <p className="text-xs text-slate-400">{profile.full_name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-slate-500">{formatDate(profile.created_at)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${profile.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                                {profile.is_active ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {!isCurrentUser && (
                                                <button
                                                    onClick={() => toggleActive(profile)}
                                                    disabled={saving === profile.id}
                                                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 ml-auto ${profile.is_active ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-green-200 text-green-600 hover:bg-green-50"} disabled:opacity-50`}>
                                                    {saving === profile.id
                                                        ? <Loader2 size={12} className="animate-spin" />
                                                        : <Shield size={12} />}
                                                    {profile.is_active ? "Nonaktifkan" : "Aktifkan"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};