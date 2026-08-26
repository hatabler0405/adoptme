import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  ArrowRight, 
  Search, 
  PawPrint, 
  Navigation2, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataCache } from '../context/DataCacheContext';
import api from '../services/api';

const SHELTER_COORDS = {
  1: { lat: 39.4397, lng: -77.9402 },
  2: { lat: 39.3789, lng: -77.8761 },
};

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

export default function SheltersDirectoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getCachedData, setCachedData } = useDataCache();

  const cacheKey = 'all_shelters_directory';
  const cachedEntry = getCachedData(cacheKey);

  const [sheltersList, setSheltersList] = useState(() => {
    return cachedEntry?.data || [];
  });
  const [loading, setLoading] = useState(!cachedEntry);
  const [search, setSearch] = useState('');
  
  // Default to user's saved ZIP if authenticated, otherwise empty
  const [zipCode, setZipCode] = useState(() => user?.zipCode || '');
  // Default to Any Distance (empty string)
  const [radius, setRadius] = useState(() => (user?.zipCode ? '50' : ''));
  const [userCoords, setUserCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Auto-center search when a user signs in or registers with a ZIP code
  useEffect(() => {
    if (user?.zipCode && user.zipCode.trim().length === 5) {
      setZipCode(user.zipCode);
      setRadius('50');
    }
  }, [user]);

  const loadShelters = useCallback(async () => {
    if (!cachedEntry) {
      setLoading(true);
    }
    try {
      const res = await api.get('/shelters');
      const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      setSheltersList(data);
      setCachedData(cacheKey, data);
    } catch (err) {
      console.error('Failed to load /api/shelters:', err);
      if (!cachedEntry) {
        setSheltersList([]);
      }
    } finally {
      setLoading(false);
    }
  }, [cachedEntry, setCachedData]);

  useEffect(() => {
    loadShelters();
  }, [loadShelters]);

  useEffect(() => {
    if (!zipCode || zipCode.trim().length !== 5) {
      setUserCoords(null);
      return;
    }

    let isMounted = true;
    async function fetchUserZipCoords() {
      setGeoLoading(true);
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${zipCode.trim()}`);
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
        if (isMounted) setGeoLoading(false);
      }
    }

    fetchUserZipCoords();
    return () => {
      isMounted = false;
    };
  }, [zipCode]);

  const displayShelters = useMemo(() => {
    return sheltersList
      .map((shelter) => {
        const coords = SHELTER_COORDS[shelter.id] || {
          lat: parseFloat(shelter.latitude || 39.41),
          lng: parseFloat(shelter.longitude || -77.91),
        };

        let distance = null;
        if (userCoords && coords.lat && coords.lng) {
          distance = calculateDistanceMiles(
            userCoords.latitude,
            userCoords.longitude,
            coords.lat,
            coords.lng
          );
        }

        return {
          ...shelter,
          distance,
        };
      })
      .filter((shelter) => {
        const name = (shelter.name || '').toLowerCase();
        const addr = (shelter.address || shelter.location || '').toLowerCase();
        const term = search.toLowerCase().trim();

        const matchesSearch = term === '' || name.includes(term) || addr.includes(term);
        const radiusNum = parseFloat(radius);
        const withinRadius =
          userCoords && shelter.distance !== null && radiusNum > 0
            ? shelter.distance <= radiusNum
            : true;

        return matchesSearch && withinRadius;
      })
      .sort((a, b) => {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        return 0;
      });
  }, [sheltersList, userCoords, search, radius]);

  const handleReset = () => {
    setSearch('');
    setZipCode(user?.zipCode || '');
    setRadius(user?.zipCode ? '50' : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0f172a]/60 dark:text-white dark:placeholder-slate-500';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Partner Shelters & Rescues
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Showing rescue organizations verified in your database.
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/90 dark:shadow-xl backdrop-blur-md space-y-4 transition-colors">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
          <div className="sm:col-span-6">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Search Shelters
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Berkeley County Humane Society..."
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              ZIP Code
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g. 25405"
                maxLength={5}
                className={`${inputClass} pl-9 pr-8`}
              />
              {geoLoading && (
                <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Search Radius
            </label>
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className={inputClass}
            >
              <option value="">Any Distance</option>
              <option value="5">Within 5 miles</option>
              <option value="15">Within 15 miles</option>
              <option value="30">Within 30 miles</option>
              <option value="50">Within 50 miles</option>
              <option value="100">Within 100 miles</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
          {userCoords ? (
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Navigation2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Origin: <strong className="text-slate-900 dark:text-white">{userCoords.name}</strong> ({zipCode}) &bull; Filter: <strong className="text-slate-900 dark:text-white">{radius ? `${radius} miles` : 'Any Distance'}</strong>
              </span>
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">Showing all {sheltersList.length} registered shelters.</span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer ml-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Shelters Grid */}
      {loading && sheltersList.length === 0 ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : displayShelters.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/40 space-y-3">
          <p className="text-base font-semibold text-slate-600 dark:text-slate-400">
            {sheltersList.length === 0
              ? 'No shelters found in database.'
              : `No shelters found within ${radius} miles of ${userCoords?.name || zipCode}.`}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {displayShelters.map((shelter) => {
            const petCount = (shelter.animals || shelter.pets || []).length;
            const phone = shelter.phoneNumber || shelter.phone;

            return (
              <div
                key={shelter.id}
                onClick={() => navigate(`/shelters/${shelter.id}`)}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/90 dark:shadow-xl backdrop-blur-md transition-all hover:border-blue-500 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/40 shrink-0">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors">
                          {shelter.name}
                        </h3>
                        <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span>{shelter.address || shelter.location || 'Address on file'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:border-blue-900/40 dark:text-blue-300">
                        <PawPrint className="h-3.5 w-3.5" />
                        <span>{petCount} Pets</span>
                      </span>
                      {shelter.distance !== null && shelter.distance !== undefined && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Navigation2 className="h-3 w-3" />
                          <span>{Number(shelter.distance).toFixed(1)} mi away</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {shelter.description && (
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {shelter.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        {phone}
                      </span>
                    )}
                    {shelter.hours && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        {shelter.hours}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>View Shelter Profile</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}