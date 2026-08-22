import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, Globe, Clock, ArrowLeft, PawPrint, Loader2, FileText, ExternalLink } from 'lucide-react';
import PetCard from '../components/PetCard';
import PetModal from '../components/PetModal';
import ShelterReviews from '../components/ShelterReviews';
import api from '../services/api';

export default function ShelterDetailsPage() {
  const { shelterId } = useParams();
  const [shelter, setShelter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    const fetchShelterData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/shelters/${shelterId}`);
        setShelter(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load shelter details.');
      } finally {
        setLoading(false);
      }
    };

    fetchShelterData();
  }, [shelterId]);

  const shelterAnimals = useMemo(() => {
    if (!shelter) return [];
    const list = shelter.animals || shelter.pets || [];
    return list.map((pet) => ({
      ...pet,
      shelterId: shelter.id,
      shelterName: shelter.name,
      shelterAddress: shelter.address || shelter.location,
      shelterPhone: shelter.phoneNumber || shelter.phone,
      shelterEmail: shelter.email,
      adoptionUrl: shelter.adoptionListingsUrl || shelter.adoptionUrl,
    }));
  }, [shelter]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (error || !shelter) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center space-y-4">
        <p className="text-base font-semibold text-rose-600 dark:text-rose-400">
          {error || 'Shelter not found.'}
        </p>
        <Link
          to="/shelters"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Shelters Directory</span>
        </Link>
      </div>
    );
  }

  const phone = shelter.phoneNumber || shelter.phone;
  const applicationUrl = shelter.adoptionListingsUrl || shelter.adoptionUrl;

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/shelters"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Shelters</span>
        </Link>

        {/* Shelter Header Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/90 sm:p-8 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-blue-50 p-4 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 shrink-0">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {shelter.name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{shelter.address || shelter.location}</span>
                </p>
                {shelter.description && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                    {shelter.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0 sm:min-w-50">
              {/* Adoption Application Button or Fallback */}
              {applicationUrl ? (
                <a
                  href={applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Adoption Application Form</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                  Sorry, we don't have the link for the application form at this time.
                </div>
              )}

              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Shelter</span>
                </a>
              )}
              {shelter.email && (
                <a
                  href={`mailto:${shelter.email}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Send Email</span>
                </a>
              )}
              {shelter.websiteUrl && (
                <a
                  href={shelter.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>

          {shelter.hours && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Visiting Hours: {shelter.hours}</span>
            </div>
          )}
        </div>

        {/* Adoptable Animals Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Adoptable Pets at {shelter.name} ({shelterAnimals.length})
            </h2>
          </div>

          {shelterAnimals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#0b1329]/40">
              No pets currently listed under this shelter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shelterAnimals.map((pet) => (
                <PetCard
                  key={pet.id}
                  animal={pet}
                  onSelect={() => setSelectedPet(pet)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Shelter Reviews */}
        <ShelterReviews shelterId={shelterId} shelterName={shelter.name} />
      </div>

      <PetModal
        animal={selectedPet}
        isOpen={!!selectedPet}
        onClose={() => setSelectedPet(null)}
      />
    </>
  );
}