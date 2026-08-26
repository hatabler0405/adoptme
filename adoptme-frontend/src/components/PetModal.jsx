import React, { useState, useEffect } from 'react';
import { X, Heart, MapPin, Check, Phone, Mail, Building2, Loader2, FileText, ExternalLink, DollarSign } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const KNOWN_SHELTERS = {
  1: {
    id: 1,
    name: 'Berkeley County Humane Society',
    address: '554 Charles Town Rd, Martinsburg, WV',
    phoneNumber: '304-267-8389',
    email: 'info@berkeleywvhumane.org',
  },
  2: {
    id: 2,
    name: 'Animal Welfare Society of Jefferson County',
    address: '23 Poor Farm Rd, Kearneysville, WV',
    phoneNumber: '304-725-0589',
    email: 'info@awsjc.org',
  },
};

export default function PetModal({ animal, isOpen, onClose }) {
  const { user, openAuthModal } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [fullAnimal, setFullAnimal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !animal) {
      setFullAnimal(null);
      return;
    }

    const rawPet = animal.animal || animal;
    setFullAnimal(rawPet);

    const petId = rawPet.id || rawPet.animalId;
    if (petId && (!rawPet.description || !rawPet.breed)) {
      setLoading(true);
      api.get(`/animals/${petId}`)
        .then((res) => {
          if (res.data) {
            setFullAnimal((prev) => ({ ...prev, ...res.data }));
          }
        })
        .catch((err) => {
          console.error('Failed to load full animal details:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, animal]);

  if (!isOpen || !fullAnimal) return null;

  const petId = fullAnimal.id || fullAnimal.animalId;
  const favorited = isFavorite(petId);

  const handleFavoriteToggle = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (favorited) {
      removeFavorite(petId);
    } else {
      addFavorite(fullAnimal);
    }
  };

  const petName = fullAnimal.name || fullAnimal.animalName || 'Adoptable Pet';
  const petGender = fullAnimal.gender || fullAnimal.sex || 'Unknown';
  const petBreed = fullAnimal.breed || fullAnimal.animalBreed || 'Domestic Mix';
  const petSpecies = fullAnimal.species || fullAnimal.animalSpecies || 'Pet';
  const petAge = fullAnimal.age !== null && fullAnimal.age !== undefined ? `${fullAnimal.age}` : 'Unknown age';
  const petSize = fullAnimal.size || 'Medium';

  const adoptionFee = fullAnimal.adoptionFee !== null && fullAnimal.adoptionFee !== undefined
    ? `$${Number(fullAnimal.adoptionFee).toFixed(0)}`
    : null;

  const shelterId = Number(
    fullAnimal.shelterId ||
    fullAnimal.shelter?.id ||
    (fullAnimal.shelterName?.includes('Berkeley') ? 1 : fullAnimal.shelterName?.includes('Jefferson') ? 2 : 1)
  );
  const fallback = KNOWN_SHELTERS[shelterId] || KNOWN_SHELTERS[1];

  const shelterName = fullAnimal.shelterName || fullAnimal.shelter?.name || fallback.name;
  const shelterLocation = fullAnimal.shelterAddress || fullAnimal.shelter?.address || fallback.address;
  const shelterPhone = fullAnimal.shelterPhone || fullAnimal.shelter?.phoneNumber || fallback.phoneNumber;
  const shelterEmail = fullAnimal.shelterEmail || fullAnimal.shelter?.email || fallback.email;
  const adoptionUrl = fullAnimal.adoptionUrl || fullAnimal.adoptionListingsUrl || fullAnimal.shelter?.adoptionListingsUrl || fullAnimal.shelter?.websiteUrl;

  const goodWithKids = fullAnimal.goodWithKids ?? fullAnimal.goodWithChildren ?? null;
  const goodWithDogs = fullAnimal.goodWithDogs ?? null;
  const goodWithCats = fullAnimal.goodWithCats ?? null;

  const description = fullAnimal.description || `${petName} is an active, loving companion looking for a forever home. Vaccinated and ready for adoption.`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0b1329] sm:p-8 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-10 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Photo & Favorite Action */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                <img
                  src={
                    fullAnimal.imageUrl ||
                    fullAnimal.photoUrl ||
                    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80'
                  }
                  alt={petName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <button
                  type="button"
                  onClick={handleFavoriteToggle}
                  className={`absolute top-3 right-3 rounded-full p-2.5 backdrop-blur-md transition-transform active:scale-90 cursor-pointer ${
                    favorited ? 'bg-rose-500 text-white shadow-md' : 'bg-black/40 text-white hover:bg-black/60'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Attributes & Key Details */}
              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pr-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {petName}
                    </h2>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 uppercase tracking-wider">
                      {petSpecies}
                    </span>
                  </div>

                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{shelterLocation}</span>
                  </p>

                  {/* Badges Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Breed</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{petBreed}</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Age / Gender</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{petAge} &bull; {petGender}</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Size</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{petSize}</span>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Adoption Fee</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300 block">{adoptionFee || 'Inquire'}</span>
                    </div>
                  </div>
                </div>

                {/* Compatibility Tags */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Compatibility
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {goodWithKids && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Check className="h-3 w-3" /> Good with Kids
                      </span>
                    )}
                    {goodWithDogs && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Check className="h-3 w-3" /> Good with Dogs
                      </span>
                    )}
                    {goodWithCats && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Check className="h-3 w-3" /> Good with Cats
                      </span>
                    )}
                    {!goodWithKids && !goodWithDogs && !goodWithCats && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">Standard household temperament.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">About {petName}</h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-6">
                {description}
              </p>
            </div>

            {/* Application CTA */}
            <div className="mt-6">
              {adoptionUrl ? (
                <a
                  href={adoptionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>Submit Adoption Application</span>
                  <ExternalLink className="h-4 w-4 opacity-80" />
                </a>
              ) : (
                <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                  Adoption application link available through direct shelter contact below.
                </div>
              )}
            </div>

            {/* Shelter Footer */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#070d1e]">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {shelterName}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {shelterPhone && (
                  <a
                    href={`tel:${shelterPhone}`}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call</span>
                  </a>
                )}
                {shelterEmail && (
                  <a
                    href={`mailto:${shelterEmail}?subject=Adoption Inquiry: ${petName}`}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Inquire</span>
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}