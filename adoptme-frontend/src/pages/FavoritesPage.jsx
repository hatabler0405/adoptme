import React, { useState, useEffect, useMemo } from 'react';
import { Heart, PawPrint, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import PetCard from '../components/PetCard';
import PetModal from '../components/PetModal';
import { userService } from '../services/api';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [selectedPet, setSelectedPet] = useState(null);

  // New state for tabs and recommendations
  const [activeTab, setActiveTab] = useState('favorites');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Normalize list whether backend returns array of Animal or array of Favorite records
  const normalizedFavorites = useMemo(() => {
    if (!Array.isArray(favorites)) return [];
    return favorites.map((fav) => {
      const pet = fav.animal || fav;
      return {
        ...pet,
        id: pet.id || fav.animalId || fav.id,
      };
    });
  }, [favorites]);

  // Fetch recommendations when the tab is switched
  useEffect(() => {
    if (activeTab === 'recommendations' && recommendations.length === 0) {
      const fetchRecs = async () => {
        setLoadingRecs(true);
        try {
          const data = await userService.getRecommendations();
          setRecommendations(data || []);
        } catch (err) {
          console.error('Failed to load recommendations:', err);
        } finally {
          setLoadingRecs(false);
        }
      };
      fetchRecs();
    }
  }, [activeTab, recommendations.length]);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                My Animals
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Your saved animals and personalized AI recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'favorites'
                ? 'border-b-2 border-rose-500 text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Heart className="h-4 w-4" />
            Saved Favorites ({normalizedFavorites.length})
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'recommendations'
                ? 'border-b-2 border-blue-600 text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            Recommended For You
          </button>
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'favorites' ? (
          normalizedFavorites.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/40 space-y-3">
              <PawPrint className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                You haven't saved any pets to your favorites yet.
              </p>
              <Link
                to="/"
                className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Browse Pets
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {normalizedFavorites.map((pet) => (
                <PetCard
                  key={pet.id}
                  animal={pet}
                  onSelect={() => setSelectedPet(pet)}
                />
              ))}
            </div>
          )
        ) : (
          /* Recommendations View */
          loadingRecs ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/40">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/40 space-y-3">
              <Sparkles className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Favorite a few more pets so we can learn what you like!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recommendations.map((pet) => (
                <PetCard key={pet.id} animal={pet} onSelect={() => setSelectedPet(pet)} />
              ))}
            </div>
          )
        )}
      </div>

      <PetModal
        animal={selectedPet}
        isOpen={!!selectedPet}
        onClose={() => setSelectedPet(null)}
      />
    </>
  );
}