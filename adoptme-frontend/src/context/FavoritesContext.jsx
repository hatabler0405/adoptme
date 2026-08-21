import React, { createContext, useContext, useState, useEffect } from 'react';
import { favoriteService } from '../services/api';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }
    try {
      setLoading(true);
      const data = await favoriteService.getFavorites();
      setFavorites(data || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [isAuthenticated]);

  const isFavorite = (animalId) => {
    return favorites.some((item) => item.id === animalId);
  };

  const addFavorite = async (animal) => {
    try {
      setFavorites((prev) => [...prev, animal]);
      await favoriteService.addFavorite(animal.id);
    } catch (err) {
      console.error('Failed to add favorite:', err);
      loadFavorites(); // Revert on failure
    }
  };

  const removeFavorite = async (animalId) => {
    try {
      setFavorites((prev) => prev.filter((item) => item.id !== animalId));
      await favoriteService.removeFavorite(animalId);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      loadFavorites(); // Revert on failure
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        isFavorite,
        addFavorite,
        removeFavorite,
        refreshFavorites: loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);