import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, PawPrint, Navigation2, ChevronLeft, ChevronRight } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import PetCard from '../components/PetCard';
import PetMap from '../components/PetMap';
import PetModal from '../components/PetModal';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataCacheContext';
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
  const { getCachedData, setCachedData } = useDataCache();

  const [filters, setFilters] = useState({
    name: '',
    breed: '',
    species: '',
    gender: '',
    size: '',
    minAge: '',
    maxAge: '',
    zipCode: user?.zipCode || '',
    radius: user?.zipCode ? '50' : '',
    goodWithKids: false,
    goodWithDogs: false,
    goodWithCats: false,
  });

  const [selectedPet, setSelectedPet] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [geoReady, setGeoReady] = useState(false);

  const cacheKey = useMemo(() => {
    return `explore_${JSON.stringify(filters)}_coords_${userCoords?.latitude}_${currentPage}`;
  }, [filters, userCoords, currentPage]);

  const cachedEntry = getCachedData(cacheKey);

  const [rawAnimals, setRawAnimals] = useState(() => {
    if (cachedEntry?.data) {
      return cachedEntry.data.content || (Array.isArray(cachedEntry.data) ? cachedEntry.data : []);
    }
    return [];
  });

  const [totalPages, setTotalPages] = useState(() => cachedEntry?.data?.totalPages || 0);
  const [totalElements, setTotalElements] = useState(() => cachedEntry?.data?.totalElements || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    if (user?.zipCode && user.zipCode.trim().length === 5) {
      setFilters((prev) => ({
        ...prev,
        zipCode: user.zipCode.trim(),
        radius: prev.radius || '50',
      }));
      setCurrentPage(0);
    }
  }, [user]);

  // Geocode ZIP code to exact Latitude/Longitude
  useEffect(() => {
    if (!filters.zipCode || filters.zipCode.trim().length !== 5) {
      setUserCoords(null);
      setGeoReady(true);
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
      } finally {
        if (isMounted) setGeoReady(true);
      }
    }

    setGeoReady(false);
    fetchZipCoords();
    return () => {
      isMounted = false;
    };
  }, [filters.zipCode]);

  const fetchAnimals = useCallback(
    async (pageToFetch = 0, forceLoading = false) => {
      const targetCacheKey = `explore_${JSON.stringify(filters)}_coords_${userCoords?.latitude}_${pageToFetch}`;
      const activeCache = getCachedData(targetCacheKey);

      if (!activeCache || forceLoading) {
        setLoading(true);
      }
      setError('');

      const payload = {};
      if (filters.name?.trim()) payload.name = filters.name.trim();
      if (filters.breed?.trim()) payload.breed = filters.breed.trim();
      if (filters.species) payload.species = filters.species.toUpperCase();
      if (filters.gender) payload.gender = filters.gender.toUpperCase();
      if (filters.size) payload.size = filters.size;
      if (filters.minAge !== '' && filters.minAge !== undefined) payload.minAge = parseInt(filters.minAge, 10);
      if (filters.maxAge !== '' && filters.maxAge !== undefined) payload.maxAge = parseInt(filters.maxAge, 10);
      if (filters.zipCode?.trim()) payload.zipCode = filters.zipCode.trim();

      // Send geocoded coordinates to backend
      if (userCoords?.latitude && userCoords?.longitude) {
        payload.latitude = userCoords.latitude;
        payload.longitude = userCoords.longitude;
      }
      if (filters.radius && parseFloat(filters.radius) > 0) {
        payload.radiusMiles = parseFloat(filters.radius);
      }

      if (filters.goodWithKids) payload.goodWithKids = true;
      if (filters.goodWithDogs) payload.goodWithDogs = true;
      if (filters.goodWithCats) payload.goodWithCats = true;

      try {
        const data = await animalService.searchAnimals(payload, pageToFetch, 20);

        if (data && Array.isArray(data.content)) {
          setRawAnimals(data.content);
          setTotalPages(data.totalPages || 1);
          setTotalElements(data.totalElements || data.content.length);
          setCurrentPage(data.number || pageToFetch);
          setCachedData(targetCacheKey, data);
        } else if (Array.isArray(data)) {
          setRawAnimals(data);
          setTotalPages(1);
          setTotalElements(data.length);
          setCurrentPage(0);
          setCachedData(targetCacheKey, data);
        } else {
          setRawAnimals([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      } catch (err) {
        console.error('Failed to load animals:', err);
        if (!activeCache) {
          setError('Unable to load animals from backend server.');
          setRawAnimals([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, userCoords, getCachedData, setCachedData]
  );

  useEffect(() => {
    if (geoReady) {
      fetchAnimals(currentPage);
    }
  }, [fetchAnimals, currentPage, geoReady]);

  const handlePageChange = (newPage) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(newPage);
    fetchAnimals(newPage, true);
  };

  const filteredAnimals = useMemo(() => {
    const radiusLimit = parseFloat(filters.radius);
    const isStrictRadius = !isNaN(radiusLimit) && radiusLimit > 0;

    return rawAnimals
      .map((animal) => {
        const shelter = animal.shelter;
        const lat =
          animal.shelterLatitude ??
          shelter?.latitude ??
          shelter?.lat ??
          shelter?.location?.coordinates?.[1] ??
          shelter?.location?.y ??
          null;

        const lng =
          animal.shelterLongitude ??
          shelter?.longitude ??
          shelter?.lon ??
          shelter?.location?.coordinates?.[0] ??
          shelter?.location?.x ??
          null;

        let distance = null;
        if (userCoords && lat && lng) {
          distance = calculateDistanceMiles(
            userCoords.latitude,
            userCoords.longitude,
            parseFloat(lat),
            parseFloat(lng)
          );
        }

        return {
          ...animal,
          latitude: lat ? parseFloat(lat) : null,
          longitude: lng ? parseFloat(lng) : null,
          distance,
        };
      })
      .filter((animal) => {
        // Enforce strict distance check when a radius is active
        if (userCoords && isStrictRadius) {
          if (animal.distance === null || animal.distance > radiusLimit) {
            return false;
          }
        }

        if (filters.name?.trim()) {
          const nameTerm = filters.name.toLowerCase().trim();
          const matchName = animal.name?.toLowerCase().includes(nameTerm);
          const matchBreed = animal.breed?.toLowerCase().includes(nameTerm);
          if (!matchName && !matchBreed) return false;
        }

        if (filters.goodWithKids && animal.goodWithKids !== true) return false;
        if (filters.goodWithDogs && animal.goodWithDogs !== true) return false;
        if (filters.goodWithCats && animal.goodWithCats !== true) return false;

        return true;
      })
      .sort((a, b) => {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        return 0;
      });
  }, [
    rawAnimals,
    userCoords,
    filters.radius,
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
      zipCode: '',
      radius: '',
      goodWithKids: false,
      goodWithDogs: false,
      goodWithCats: false,
    });
    setUserCoords(null);
    setCurrentPage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                Searching near <strong className="font-black text-blue-950 dark:text-white">{userCoords.name}</strong> ({filters.zipCode}) {filters.radius ? `• ${filters.radius} mi` : '• Any Distance'}
              </span>
            </div>
          )}
        </div>

        <FilterBar 
          filters={filters} 
          setFilters={(val) => {
            setCurrentPage(0);
            setFilters(val);
          }} 
          onReset={handleReset} 
        />

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Pet Cards Feed */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {loading ? (
              <div className="flex h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/40">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            ) : filteredAnimals.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/40 space-y-3">
                <PawPrint className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {userCoords && filters.radius 
                    ? `No animals found within ${filters.radius} miles of ${userCoords.name}.`
                    : 'No animals found matching your criteria.'}
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
            <PetMap 
              animals={filteredAnimals} 
              centerCoords={userCoords}
              isLoading={loading || !geoReady}
              onSelectAnimal={handleSelectAnimal} 
            />
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