'use client';

import React, { useState, useTransition } from 'react';
import { useDashboardData } from '../providers/DataProvider';
import { CATEGORY_COLORS } from '../../lib/canvasUtils';
import { CategoryType } from '../../lib/types';
import { Filter, Search, X } from 'lucide-react';

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'alpha', label: 'Alpha' },
  { id: 'beta', label: 'Beta' },
  { id: 'gamma', label: 'Gamma' },
  { id: 'delta', label: 'Delta' },
];

export const FilterPanel = React.memo(function FilterPanel() {
  const { filters, setFilters } = useDashboardData();
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [isPending, startTransition] = useTransition();

  const toggleCategory = (cat: CategoryType) => {
    setFilters((prev) => {
      const current = prev.categories;
      const exists = current.includes(cat);
      const nextCats = exists ? current.filter((c) => c !== cat) : [...current, cat];
      return { ...prev, categories: nextCats };
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    startTransition(() => {
      setFilters((prev) => ({ ...prev, searchQuery: val }));
    });
  };

  const resetFilters = () => {
    setSearchInput('');
    startTransition(() => {
      setFilters({
        categories: ['alpha', 'beta', 'gamma', 'delta'],
        valueRange: [-100, 100],
        timeWindowMs: null,
        searchQuery: '',
      });
    });
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          Filter Parameters
        </h3>
        <button
          onClick={resetFilters}
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Filter Checkboxes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Categories:</label>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const isChecked = filters.categories.includes(cat.id);
              const color = CATEGORY_COLORS[cat.id];
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${
                    isChecked
                      ? 'bg-slate-800 text-slate-100 border-slate-700 shadow-sm'
                      : 'bg-slate-950/40 text-slate-500 border-slate-800/60 opacity-60'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isChecked ? color : '#64748b' }}
                  />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Search Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-400">Telemetry Search:</label>
            {isPending && <span className="text-[10px] text-cyan-400 font-mono animate-pulse">Filtering...</span>}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by ID, Sensor, or Node..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
