import React from 'react';
import { Heart, MapPin, DollarSign } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

export default function PetCard({ animal, onSelect }) {
  const { user, openAuthModal } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const petId = animal.id || animal.animalId;
  const favorited = isFavorite(petId);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    if (favorited) {
      removeFavorite(petId);
    } else {
      addFavorite(animal);
    }
  };

  const name = animal.name || animal.animalName || 'Adoptable Pet';
  const breed = animal.breed || animal.animalBreed || 'Mixed Breed';
  const species = animal.species || animal.animalSpecies || 'Pet';
  const age = animal.age || 'Adult';
  const gender = animal.gender || 'Unknown';

  // Specific shelter location or shelter name fallback
  const locationDisplay =
    animal.shelterAddress ||
    animal.shelterName ||
    animal.shelter?.name ||
    'Regional Foster Network';

  const adoptionFee =
    animal.adoptionFee !== null && animal.adoptionFee !== undefined
      ? `$${Number(animal.adoptionFee).toFixed(0)}`
      : null;

  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-[#0b1329] cursor-pointer"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        <img
          src={
            animal.imageUrl ||
            animal.photoUrl ||
            'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80'
          }
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80';
          }}
        />

        <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-black text-white backdrop-blur-md">
          {species}
        </div>

        {adoptionFee && (
          <div className="absolute bottom-3 left-3 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[11px] font-black text-white backdrop-blur-md shadow-sm">
            {adoptionFee} Fee
          </div>
        )}

        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 rounded-full p-2.5 backdrop-blur-md transition-transform active:scale-90 cursor-pointer ${
            favorited
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/40 text-white hover:bg-black/60'
          }`}
        >
          <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="truncate text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              {name}
            </h3>
            <span className="text-xs font-bold text-slate-500 capitalize">
              {gender.toLowerCase()}
            </span>
          </div>

          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {breed} &bull; {age}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="truncate">{locationDisplay}</span>
        </div>
      </div>
    </div>
  );
}