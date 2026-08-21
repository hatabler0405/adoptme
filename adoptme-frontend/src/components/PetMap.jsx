import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, ExternalLink, PawPrint, ChevronRight } from 'lucide-react';

const KNOWN_SHELTERS = {
  1: {
    id: 1,
    name: 'Berkeley County Humane Society',
    address: '554 Charles Town Rd, Martinsburg, WV',
    phoneNumber: '304-267-8389',
    lat: 39.4397,
    lng: -77.9402,
  },
  2: {
    id: 2,
    name: 'Animal Welfare Society of Jefferson County',
    address: '23 Poor Farm Rd, Kearneysville, WV',
    phoneNumber: '304-725-0589',
    lat: 39.3789,
    lng: -77.8761,
  },
};

const customPinIcon = L.divIcon({
  className: 'custom-map-marker',
  html: `
    <div style="
      background-color: #2563eb;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: transform 0.15s ease;
    ">
      <svg style="transform: rotate(45deg); width: 16px; height: 16px; fill: white;" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function PetMap({ animals = [], onSelectAnimal }) {
  const navigate = useNavigate();

  // ONLY generate markers for shelters that have at least 1 filtered animal
  const activeMarkers = useMemo(() => {
    if (!Array.isArray(animals) || animals.length === 0) {
      return [];
    }

    const shelterMap = new Map();

    animals.forEach((animal) => {
      const rawId = animal.shelterId ?? animal.shelter?.id;
      let sId = rawId ? Number(rawId) : null;

      if (!sId) {
        const name = (animal.shelterName || animal.shelter?.name || '').toLowerCase();
        if (name.includes('berkeley')) sId = 1;
        else if (name.includes('jefferson') || name.includes('welfare')) sId = 2;
        else sId = 1;
      }

      const fallback = KNOWN_SHELTERS[sId] || KNOWN_SHELTERS[1];

      if (!shelterMap.has(sId)) {
        shelterMap.set(sId, {
          id: sId,
          name: animal.shelterName || fallback.name,
          address: animal.shelterAddress || fallback.address,
          phone: animal.shelterPhone || fallback.phoneNumber,
          lat: fallback.lat,
          lng: fallback.lng,
          animals: [],
        });
      }
      shelterMap.get(sId).animals.push(animal);
    });

    return Array.from(shelterMap.values());
  }, [animals]);

  const defaultCenter = [39.41, -77.91];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-gray-200 shadow-sm dark:border-gray-800">
      <MapContainer
        center={activeMarkers.length > 0 ? [activeMarkers[0].lat, activeMarkers[0].lng] : defaultCenter}
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ minHeight: '100%', height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {activeMarkers.map((shelter) => (
          <Marker
            key={shelter.id}
            position={[shelter.lat, shelter.lng]}
            icon={customPinIcon}
            eventHandlers={{
              mouseover: (e) => {
                e.target.openPopup();
              },
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[240px]">
                {/* Shelter Header */}
                <div
                  onClick={() => navigate(`/shelters/${shelter.id}`)}
                  className="cursor-pointer group border-b border-gray-100 dark:border-gray-700 pb-2 hover:opacity-90"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                      {shelter.name}
                    </h4>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {shelter.address || 'Address unavailable'}
                  </p>
                  {shelter.phone && (
                    <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" />
                      {shelter.phone}
                    </p>
                  )}
                </div>

                {/* Available Pets Count */}
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                    <PawPrint className="h-3.5 w-3.5" />
                    {shelter.animals.length} {shelter.animals.length === 1 ? 'Pet' : 'Pets'} Matching
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/shelters/${shelter.id}`)}
                    className="text-[11px] font-bold text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-0.5"
                  >
                    View Shelter <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                </div>

                {/* Pet Image Previews */}
                {shelter.animals.length > 0 && (
                  <div className="mt-3 space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Matching Pets ({shelter.animals.length})
                    </span>
                    {shelter.animals.slice(0, 3).map((pet) => (
                      <div
                        key={pet.id}
                        onClick={() => onSelectAnimal && onSelectAnimal(pet)}
                        className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        {pet.imageUrl ? (
                          <img
                            src={pet.imageUrl}
                            alt={pet.name}
                            className="h-8 w-8 rounded-md object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop&q=60';
                            }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
                            <PawPrint className="h-4 w-4" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            {pet.name}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {pet.breed || pet.species} &bull; {pet.age ? `${pet.age} yrs` : 'Young'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}