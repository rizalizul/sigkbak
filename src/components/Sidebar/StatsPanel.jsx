export const StatsPanel = ({ filtered, total }) => (
    <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Ditampilkan</p>
            <p className="text-xl font-bold text-slate-800">{filtered.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Total Objek</p>
            <p className="text-xl font-bold text-slate-800">{total.toLocaleString()}</p>
        </div>
    </div>
);
