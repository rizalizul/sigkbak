import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";

export const UpdatePasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [msg, setMsg] = useState(null);

    // Memeriksa apakah user benar-benar datang dari link email (membawa sesi)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Sesi tidak valid atau telah kedaluwarsa. Silakan minta tautan pemulihan yang baru di halaman login.");
            }
        };
        checkSession();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        // Memperbarui password user yang sedang aktif
        const { error: err } = await supabase.auth.updateUser({
            password: password
        });

        if (err) {
            setError(err.message);
        } else {
            setMsg("Kata sandi berhasil diubah! Anda akan dialihkan ke dashboard...");
            setTimeout(() => {
                navigate("/admin/dashboard");
            }, 2500);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Buat Kata Sandi Baru</h1>
                    <p className="text-slate-500 mt-1 text-sm">Silakan masukkan kata sandi baru untuk akun Anda.</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                    {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}
                    {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{msg}</div>}
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Kata Sandi Baru</label>
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Minimal 6 karakter"
                                className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                            />
                            <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || error?.includes("Sesi tidak valid")}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : "Simpan Kata Sandi"}
                    </button>
                </form>
            </div>
        </div>
    );
};