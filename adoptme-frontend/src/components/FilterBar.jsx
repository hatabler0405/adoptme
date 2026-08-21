import React from 'react';
import { RotateCcw, Search, MapPin } from 'lucide-react';

export default function FilterBar({ filters, setFilters, onReset }) {
  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0f172a]/60 dark:text-slate-100 dark:placeholder-slate-500';

  const labelClass =
    'block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/90 dark:shadow-xl backdrop-blur-md space-y-4 transition-colors">
      {/* Row 1: Search, Breed, Location & Radius */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        <div className="sm:col-span-4">
          <label className={labelClass}>Pet Name</label>
          <input
            type="text"
            value={filters.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Search by name (e.g. Milo)..."
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-4">
          <label className={labelClass}>Breed</label>
          <input
            type="text"
            value={filters.breed || ''}
            onChange={(e) => handleChange('breed', e.target.value)}
            placeholder="Search by breed (e.g. Retriever)..."
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Your ZIP</label>
          <input
            type="text"
            value={filters.zipCode || ''}
            onChange={(e) => handleChange('zipCode', e.target.value)}
            placeholder="e.g. 25405"
            maxLength={5}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Distance</label>
          <select
            value={filters.radius || '50'}
            onChange={(e) => handleChange('radius', e.target.value)}
            className={inputClass}
          >
            <option value="5">Within 5 mi</option>
            <option value="15">Within 15 mi</option>
            <option value="30">Within 30 mi</option>
            <option value="50">Within 50 mi</option>
            <option value="500">Any Distance</option>
          </select>
        </div>
      </div>

      {/* Row 2: Species, Gender, Size, Age Range */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        <div className="sm:col-span-3">
          <label className={labelClass}>Species</label>
          <select
            value={filters.species || ''}
            onChange={(e) => handleChange('species', e.target.value)}
            className={inputClass}
          >
            <option value="">All Species</option>
            <option value="DOG">Dogs</option>
            <option value="CAT">Cats</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className={labelClass}>Gender</label>
          <select
            value={filters.gender || ''}
            onChange={(e) => handleChange('gender', e.target.value)}
            className={inputClass}
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className={labelClass}>Size</label>
          <select
            value={filters.size || ''}
            onChange={(e) => handleChange('size', e.target.value)}
            className={inputClass}
          >
            <option value="">All Sizes</option>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className={labelClass}>Age Range</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.minAge ?? ''}
              onChange={(e) => handleChange('minAge', e.target.value)}
              className={inputClass}
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.maxAge ?? ''}
              onChange={(e) => handleChange('maxAge', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Checkboxes & Reset */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-3 text-xs">
        <div className="flex items-center gap-5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Good With:
          </span>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={!!filters.goodWithKids}
              onChange={(e) => handleChange('goodWithKids', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-blue-600"
            />
            <span>Kids</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={!!filters.goodWithDogs}
              onChange={(e) => handleChange('goodWithDogs', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-blue-600"
            />
            <span>Dogs</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={!!filters.goodWithCats}
              onChange={(e) => handleChange('goodWithCats', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-blue-600"
            />
            <span>Cats</span>
          </label>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}