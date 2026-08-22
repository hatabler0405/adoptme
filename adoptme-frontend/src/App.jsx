import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/NavBar';
import AuthModal from './components/AuthModal';
import ExplorePage from './pages/ExplorePage';
import SheltersDirectoryPage from './pages/SheltersDirectoryPage';
import ShelterDetailsPage from './pages/ShelterDetailsPage';
import FavoritesPage from './pages/FavoritesPage';
import SettingsPage from './pages/SettingsPage';
import BreedsPage from './pages/BreedsPage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#060b18] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/shelters" element={<SheltersDirectoryPage />} />
          <Route path="/shelters/:shelterId" element={<ShelterDetailsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/breeds" element={<BreedsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <AuthModal />
    </div>
  );
}