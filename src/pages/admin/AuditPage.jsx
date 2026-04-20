import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, Filter, RefreshCw } from "lucide-react";

const ActionBadge = ({ action }) => {
    const map = {
        INSERT: "bg-green-100 text-green-700",
        UPDATE: "bg-blue-100 text-blue-700",
        DELETE: "bg-rose-100 text-rose-700",
        REGISTER: "bg-purple-100 text-purple-700",
        LOGIN: "bg-teal-100 text-teal-700",
        LOGOUT: "bg-amber-100 text-amber-700",
        DEACTIVATE: "bg-slate-700 text-white",
        ACTIVATE: "bg-emerald-100 text-emerald-800",
    };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${map[action] || "bg-slate-100 text-slate-600"}`}>
            {action}
        </span>
    );
};

const TableBadge = ({ name }) => (
    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{name}</span>
);

export const AuditPage = () => {
    const [logs,    setLogs]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter,  setFilter]  = useState("all"); 
    const [page,    setPage]    = useState(0);
    const PAGE_SIZE = 30;

    const fetchLogs = async () => {
        setLoading(true);
        let q = supabase
            .from("audit_log")
            .select("*")
            .order("created_at", { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (filter !== "all") q = q.eq("action", filter);

        const { data } = await q;
        setLogs(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, [filter, page]); // eslint-disable-line

    const formatDate = (str) => {
        const d = new Date(str);
        return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };
    // Daftar filter yang diperluas
    const filterOptions = ["all", "INSERT", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "REGISTER"];

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Riwayat Aktivitas</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Log semua perubahan data oleh editor</p>
                </div>
                <button onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter size={13} className="text-slate-400" />
                {filterOptions.map((f) => (
                    <button key={f} onClick={() => { setFilter(f); setPage(0); }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                        {f === "all" ? "Semua" : f}
                    </button>
                ))}
            </div>

            {/* Tabel Log */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                        <Loader2 size={18} className="animate-spin" /> Memuat log...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">Belum ada aktivitas tercatat.</div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-50">
                            {logs.map((log) => (
                                <div key={log.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                            <ActionBadge action={log.action} />
                                            <TableBadge name={log.table_name} />
                                            <span className="text-sm font-medium text-slate-800 truncate">
                                                {log.record_name || `#${log.record_id}`}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        oleh <span className="font-medium text-slate-600">{log.user_email || "—"}</span>
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                                className="text-sm px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40">
                                ← Sebelumnya
                            </button>
                            <span className="text-xs text-slate-400">Halaman {page + 1}</span>
                            <button onClick={() => setPage((p) => p + 1)} disabled={logs.length < PAGE_SIZE}
                                className="text-sm px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40">
                                Berikutnya →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};