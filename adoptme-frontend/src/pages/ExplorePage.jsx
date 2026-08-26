import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, PawPrint, Navigation2, ChevronLeft, ChevronRight } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import PetCard from '../components/PetCard';
import PetMap from '../components/PetMap';
import PetModal from '../components/PetModal';
import { useAuth } from '../context/AuthContext';
import { animalService } from '../services/api';

function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const location = useLocation();
  const [rawAnimals, setRawAnimals] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userCoords, setUserCoords] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filters, setFilters] = useState({
    name: '',
    breed: '',
    species: '',
    gender: '',
    size: '',
    minAge: '',
    maxAge: '',
    zipCode: '25405',
    radius: '50',
    goodWithKids: false,
    goodWithDogs: false,
    goodWithCats: false,
  });

  useEffect(() => {
    if (location.state?.breed) {
      setFilters((prev) => ({
        ...prev,
        breed: location.state.breed,
        species: location.state.species ? location.state.species.toUpperCase() : prev.species,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (user?.zipCode) {
      setFilters((prev) => ({ ...prev, zipCode: user.zipCode }));
    }
  }, [user]);

  useEffect(() => {
    if (!filters.zipCode || filters.zipCode.trim().length !== 5) {
      setUserCoords(null);
      return;
    }

    let isMounted = true;
    async function fetchZipCoords() {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${filters.zipCode.trim()}`);
        if (res.ok) {
          const data = await res.json();
          const place = data.places?.[0];
          if (place && isMounted) {
            setUserCoords({
              latitude: parseFloat(place.latitude),
              longitude: parseFloat(place.longitude),
              name: `${place['place name']}, ${place['state abbreviation']}`,
            });
          }
        } else if (isMounted) {
          setUserCoords(null);
        }
      } catch {
        if (isMounted) setUserCoords(null);
      }
    }

    fetchZipCoords();
    return () => {
      isMounted = false;
    };
  }, [filters.zipCode]);

  const fetchAnimals = useCallback(
    async (pageToFetch = 0) => {
      setLoading(true);
      setError('');

      // Build payload matching backend AnimalFilterRequest contract strictly
      const payload = {};
      if (filters.breed?.trim()) payload.breed = filters.breed.trim();
      if (filters.species) payload.species = filters.species.toUpperCase();
      if (filters.gender) payload.gender = filters.gender.toUpperCase();
      if (filters.size) payload.size = filters.size;
      if (filters.zipCode?.trim()) payload.zipCode = filters.zipCode.trim();
      if (filters.radius) payload.radiusMiles = parseFloat(filters.radius);

      try {
        const data = await animalService.searchAnimals(payload, pageToFetch, 16);

        if (data && Array.isArray(data.content)) {
          setRawAnimals(data.content);
          setTotalPages(data.totalPages || 1);
          setTotalElements(data.totalElements || data.content.length);
          setCurrentPage(data.number || pageToFetch);
        } else if (Array.isArray(data)) {
          setRawAnimals(data);
          setTotalPages(1);
          setTotalElements(data.length);
          setCurrentPage(0);
        } else {
          setRawAnimals([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      } catch (err) {
        console.error('Failed to load animals:', err);
        setError('Unable to load animals from backend server.');
        setRawAnimals([]);
      } finally {
        setLoading(false);
      }
    },
    [
      filters.breed,
      filters.species,
      filters.gender,
      filters.size,
      filters.zipCode,
      filters.radius,
    ]
  );

  useEffect(() => {
    setCurrentPage(0);
    fetchAnimals(0);
  }, [fetchAnimals]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchAnimals(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredAnimals = useMemo(() => {
    return rawAnimals
      .map((animal) => {
        const lat = animal.shelterLatitude ?? animal.shelter?.latitude ?? null;
        const lng = animal.shelterLongitude ?? animal.shelter?.longitude ?? null;

        let distance = null;
        if (userCoords && lat && lng) {
          distance = calculateDistanceMiles(
            userCoords.latitude,
            userCoords.longitude,
            lat,
            lng
          );
        }

        return {
          ...animal,
          latitude: lat,
          longitude: lng,
          distance,
        };
      })
      .filter((animal) => {
        // Optional client-side quick filter for pet name if typed in FilterBar
        if (filters.name?.trim()) {
          const nameTerm = filters.name.toLowerCase().trim();
          const matchName = animal.name?.toLowerCase().includes(nameTerm);
          const matchBreed = animal.breed?.toLowerCase().includes(nameTerm);
          if (!matchName && !matchBreed) return false;
        }

        // Compatibility filters (only filter if explicitly true on UI)
        if (filters.goodWithKids && animal.goodWithKids !== true) return false;
        if (filters.goodWithDogs && animal.goodWithDogs !== true) return false;
        if (filters.goodWithCats && animal.goodWithCats !== true) return false;

        return true;
      })
      .sort((a, b) => {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        return 0;
      });
  }, [
    rawAnimals,
    userCoords,
    filters.name,
    filters.goodWithKids,
    filters.goodWithDogs,
    filters.goodWithCats,
  ]);

  const handleReset = () => {
    setFilters({
      name: '',
      breed: '',
      species: '',
      gender: '',
      size: '',
      minAge: '',
      maxAge: '',
      zipCode: user?.zipCode || '25405',
      radius: '50',
      goodWithKids: false,
      goodWithDogs: false,
      goodWithCats: false,
    });
  };

  const handleSelectAnimal = async (animal) => {
    try {
      const res = await animalService.getAnimalById(animal.id);
      setSelectedPet(res || animal);
    } catch {
      setSelectedPet(animal);
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Find Your New Best Friend
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Browse adoptable pets live from our partner shelters.
            </p>
          </div>

          {userCoords && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/90 px-4 py-2 text-xs font-semibold text-blue-900 shadow-sm dark:border-blue-800/80 dark:bg-blue-950/70 dark:text-blue-200 backdrop-blur-sm">
              <Navigation2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Searching near <strong className="font-black text-blue-950 dark:text-white">{userCoords.name}</strong> ({filters.zipCode}) &bull; {filters.radius} mi
              </span>
            </div>
          )}
        </div>

        <FilterBar filters={filters} setFilters={setFilters} onReset={handleReset} />

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Pet Cards Feed */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            ) : filteredAnimals.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/40 space-y-3">
                <PawPrint className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  No animals found within {filters.radius} miles of {userCoords?.name || filters.zipCode}.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filteredAnimals.map((animal) => (
                    <PetCard
                      key={animal.id}
                      animal={animal}
                      onSelect={() => handleSelectAnimal(animal)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 shadow-sm mt-4">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 0))}
                      disabled={currentPage === 0 || loading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </button>

                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Page <strong className="font-bold text-slate-900 dark:text-white">{currentPage + 1}</strong> of{' '}
                      <strong className="font-bold text-slate-900 dark:text-white">{Math.max(totalPages, 1)}</strong>
                      {totalElements > 0 && ` (${totalElements} pets)`}
                    </span>

                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages - 1))}
                      disabled={currentPage >= totalPages - 1 || loading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Map View */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 h-140">
            <PetMap animals={filteredAnimals} onSelectAnimal={handleSelectAnimal} />
          </div>
        </div>
      </div>

      <PetModal
        animal={selectedPet}
        isOpen={!!selectedPet}
        onClose={() => setSelectedPet(null)}
      />
    </>
  );
}