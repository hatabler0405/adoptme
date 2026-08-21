import React from 'react';
import { Heart, MapPin, Check } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

export default function PetCard({ animal, onSelect }) {
  const { user, openAuthModal } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const favorited = isFavorite(animal.id);

  const handleFavorite = (e) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    if (favorited) {
      removeFavorite(animal.id);
    } else {
      addFavorite(animal);
    }
  };

  // Helper to format age
  const displayAge = typeof animal.age === 'number' ? `${animal.age} yrs` : (animal.age || 'Age unknown');

  // Parse compatibility from booleans or description text
  const desc = animal.description || '';
  const goodWithKids = animal.goodWithKids ?? desc.toLowerCase().includes('kid friendly: yes');
  const goodWithDogs = animal.goodWithDogs ?? desc.toLowerCase().includes('dog friendly: yes');
  const goodWithCats = animal.goodWithCats ?? desc.toLowerCase().includes('cat friendly: yes');

  return (
    <div
      onClick={onSelect}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={
            animal.imageUrl ||
            animal.photoUrl ||
            'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80'
          }
          alt={animal.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={handleFavorite}
          className={`absolute top-3 right-3 rounded-full p-2.5 backdrop-blur-md transition-transform active:scale-90 ${
            favorited
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/30 text-white hover:bg-black/50'
          }`}
          aria-label="Favorite"
        >
          <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
        </button>
        <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {animal.species || 'Pet'}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
            {animal.name}
          </h3>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
            {animal.gender ? animal.gender.toLowerCase() : ''}
          </span>
        </div>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
          {animal.breed || 'Mixed Breed'} &bull; {displayAge}
          {animal.weight ? ` • ${animal.weight} lbs` : ''}
        </p>

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="truncate">
            {animal.shelterName || animal.shelter?.name || animal.location || 'Local Shelter'}
          </span>
        </p>

        {/* Compatibility Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-gray-100 dark:border-gray-800">
          {goodWithKids && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Check className="h-2.5 w-2.5" /> Kids
            </span>
          )}
          {goodWithDogs && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Check className="h-2.5 w-2.5" /> Dogs
            </span>
          )}
          {goodWithCats && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Check className="h-2.5 w-2.5" /> Cats
            </span>
          )}
        </div>
      </div>
    </div>
  );
}