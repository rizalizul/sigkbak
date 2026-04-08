const FilterGroup = ({ title, items, active, onToggle }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
            <div className="flex flex-wrap gap-1.5">
                {items.map((item) => {
                    const isActive = active.includes(item);
                    return (
                        <button
                            key={item}
                            onClick={() => onToggle(item)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${isActive ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                        >
                            {item}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const FilterPanel = ({ filters, options, toggleFilter }) => (
    <div>
        <FilterGroup title="Klasifikasi Karst" items={options.klasifikasi} active={filters.klasifikasi} onToggle={(v) => toggleFilter("klasifikasi", v)} />
        <FilterGroup title="Provinsi" items={options.provinsi} active={filters.provinsi} onToggle={(v) => toggleFilter("provinsi", v)} />
    </div>
);
