import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, ExternalLink, PawPrint, ChevronRight } from 'lucide-react';

// Exact SVG Pin with zero rotation distortion — needle tip anchored at [16, 38]
const customPinIcon = L.divIcon({
  className: 'custom-map-marker',
  html: `
    <div style="filter: drop-shadow(0 4px 5px rgba(0, 0, 0, 0.35)); cursor: pointer; transition: transform 0.15s ease;">
      <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 16 38 16 38C16 38 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
        <path d="M16 22.35L14.55 21.03C9.4 16.36 6 13.28 6 9.5C6 6.42 8.42 4 11.5 4C13.24 4 14.91 4.81 16 6.09C17.09 4.81 18.76 4 20.5 4C23.58 4 26 6.42 26 9.5C26 13.28 22.6 16.36 17.45 21.04L16 22.35Z" fill="#ffffff"/>
      </svg>
    </div>
  `,
  iconSize: [32, 38],
  iconAnchor: [16, 38], // Places the needle tip on the exact GPS coordinate
  popupAnchor: [0, -38],
});

export default function PetMap({ animals = [], onSelectAnimal }) {
  const navigate = useNavigate();

  // Aggregate active shelters using coordinates provided directly from the API response
  const activeMarkers = useMemo(() => {
    if (!Array.isArray(animals) || animals.length === 0) {
      return [];
    }

    const shelterMap = new Map();

    animals.forEach((animal) => {
      const shelterId = animal.shelterId ?? animal.shelter?.id;
      const lat = animal.latitude ?? animal.shelterLatitude ?? animal.shelter?.latitude;
      const lng = animal.longitude ?? animal.shelterLongitude ?? animal.shelter?.longitude;

      if (!shelterId || !lat || !lng) {
        return;
      }

      if (!shelterMap.has(shelterId)) {
        shelterMap.set(shelterId, {
          id: shelterId,
          name: animal.shelterName || animal.shelter?.name || 'Partner Shelter',
          address: animal.shelterAddress || animal.shelter?.address || '',
          phone: animal.shelterPhone || animal.shelter?.phone || animal.shelter?.phoneNumber || '',
          lat: Number(lat),
          lng: Number(lng),
          animals: [],
        });
      }
      shelterMap.get(shelterId).animals.push(animal);
    });

    return Array.from(shelterMap.values());
  }, [animals]);

  const defaultCenter = [39.44026, -77.94054];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-gray-200 shadow-sm dark:border-gray-800">
      <MapContainer
        center={activeMarkers.length > 0 ? [activeMarkers[0].lat, activeMarkers[0].lng] : defaultCenter}
        zoom={12}
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
              <div className="p-1 min-w-60">
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
                  {shelter.address && (
                    <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {shelter.address}
                    </p>
                  )}
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