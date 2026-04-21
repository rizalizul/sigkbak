import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Lock, KeyRound, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export const ChangePasswordPage = () => {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setMessage(null);

        // 1. Validasi Sederhana
        if (password !== confirm) {
            return setMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
        }
        if (password.length < 6) {
            return setMessage({ type: "error", text: "Password minimal harus 6 karakter." });
        }

        setLoading(true);

        // 2. Eksekusi Update ke Supabase Auth
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "Password berhasil diperbarui secara permanen." });
            setPassword("");
            setConfirm("");
        }

        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Keamanan Akun</h1>
                <p className="text-sm text-slate-400 mt-0.5">Perbarui password Anda secara berkala</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center mb-6">
                    <KeyRound size={24} />
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                    {message && (
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border ${
                            message.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                            : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {message.text}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 text-left">Password Baru</label>
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Min. 6 karakter"
                                className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPw((p) => !p)} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 text-left">Konfirmasi Password Baru</label>
                        <input
                            type={showPw ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            placeholder="Ulangi password"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            "Simpan Password Baru"
                        )}
                    </button>
                </form>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 leading-relaxed text-center">
                    Setelah berhasil memperbarui password, sesi Anda akan tetap aktif. Gunakan password baru Anda pada saat login berikutnya.
                </p>
            </div>
        </div>
    );
};