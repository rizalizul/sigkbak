import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";

export const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [msg, setMsg] = useState(null);

    const [isResetMode, setIsResetMode] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMsg(null);
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
            setError(err.message);
            setLoading(false);
        } else {
            navigate("/admin/dashboard");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Silakan masukkan email Anda terlebih dahulu.");
            return;
        }
        setLoading(true);
        setError(null);
        setMsg(null);

        const { error: err } = await supabase.auth.resetPasswordForEmail(email);

        if (err) {
            setError(err.message);
        } else {
            setMsg("Tautan pemulihan telah dikirim! Silakan periksa kotak masuk atau folder spam email Anda.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-14 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl p-2">
                        <img src="/logo.png" alt="Logo KBAK" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Geoportal KBAK Indonesia</h1>
                    <p className="text-slate-400 mt-1 text-sm">
                        {isResetMode ? "Pemulihan kata sandi" : "Masuk ke panel editor"}
                    </p>
                </div>
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {isResetMode ? (
                        
                        /* --- FORM LUPA PASSWORD --- */
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}
                            {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{msg}</div>}
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Terdaftar</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="nama@email.com"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda ke email ini.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? <><Loader2 size={15} className="animate-spin" /> Mengirim...</> : "Kirim Link Pemulihan"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsResetMode(false);
                                    setError(null);
                                    setMsg(null);
                                }}
                                className="w-full py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
                            >
                                Batal & Kembali
                            </button>
                        </form>

                    ) : (

                        /* --- FORM LOGIN (Asli) --- */
                        <form onSubmit={handleLogin} className="space-y-5">
                            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}
                            {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{msg}</div>}
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="nama@email.com"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Password</label>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setIsResetMode(true);
                                            setError(null);
                                            setMsg(null);
                                        }}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        Lupa Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPw ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2.5 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? <><Loader2 size={15} className="animate-spin" /> Masuk...</> : "Masuk"}
                            </button>
                        </form>

                    )}

                    {!isResetMode && (
                        <>
                            <p className="text-center text-sm text-slate-500 mt-6">
                                Belum punya akun?{" "}
                                <Link to="/register" className="text-slate-900 font-semibold hover:underline">
                                    Daftar di sini
                                </Link>
                            </p>
                            <p className="text-center text-sm text-slate-500 mt-2">
                                <Link to="/" className="text-slate-400 hover:underline">
                                    ← Kembali ke peta
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
