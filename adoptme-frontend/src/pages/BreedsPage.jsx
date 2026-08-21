import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowUpRight, PawPrint } from 'lucide-react';
import { BREEDS_DATA } from '../data/BreedsData';

export default function BreedsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('ALL'); // ALL, Dog, Cat
  const [hypoOnly, setHypoOnly] = useState(false);

  const filteredBreeds = useMemo(() => {
    return BREEDS_DATA.filter((breed) => {
      const matchesSearch =
        breed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        breed.temperament.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        breed.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecies = selectedSpecies === 'ALL' || breed.species === selectedSpecies;
      const matchesHypo = !hypoOnly || breed.hypoallergenic;
      return matchesSearch && matchesSpecies && matchesHypo;
    });
  }, [searchTerm, selectedSpecies, hypoOnly]);

  const handleSearchAdoptable = (breedName, species) => {
    navigate('/explore', { state: { breed: breedName, species: species.toLowerCase() } });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
          <PawPrint className="h-3.5 w-3.5" />
          <span>Breed Guide & Encyclopedia</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Cat & Dog Breeds Guide
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Explore temperaments, care requirements, and allergy ratings to find the right companion for your home.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-[#0b1329]/60 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by breed or trait..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {['ALL', 'Dog', 'Cat'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedSpecies(type)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                selectedSpecies === type
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type === 'ALL' ? 'All Pets' : `${type}s`}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setHypoOnly(!hypoOnly)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer border ${
              hypoOnly
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Hypoallergenic Only
          </button>
        </div>
      </div>

      {/* Grid Results */}
      {filteredBreeds.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/40 space-y-3">
          <PawPrint className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            No breeds found matching "{searchTerm}".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecies('ALL');
              setHypoOnly(false);
            }}
            className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBreeds.map((breed) => (
            <div
              key={breed.id}
              className="flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-[#0b1329]/60 border border-slate-200 dark:border-slate-800/80 hover:border-blue-500 dark:hover:border-blue-500/60 transition-all shadow-sm group backdrop-blur-sm"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                <img
                  src={breed.imageUrl}
                  alt={breed.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-wider">
                  {breed.species}
                </span>
                {breed.hypoallergenic && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-[10px] font-black text-white shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    Allergy-Friendly
                  </span>
                )}
              </div>

              <div className="flex flex-col flex-1 p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{breed.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {breed.temperament.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">
                  {breed.description}
                </p>

                {/* Quick Specs Bar */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/40 rounded-xl">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Energy</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{breed.energy}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Grooming</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{breed.grooming}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Life Span</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{breed.lifeSpan}</span>
                  </div>
                </div>

                {/* Action button linking to explore */}
                <button
                  type="button"
                  onClick={() => handleSearchAdoptable(breed.name, breed.species)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  <span>Search Adoptable {breed.name}s</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}