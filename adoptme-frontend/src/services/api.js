import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global errors (like token expiry)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optional: window.location.href = '/login'; or trigger logout state
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------
// API Service Methods
// ----------------------------------------------------

export const authService = {
  login: async (credentials) => {
    // credentials: { email, password }
    const response = await api.post('/auth/login', credentials);
    return response.data; // { token, userId, email }
  },

  register: async (userData) => {
    // userData: { username, email, password, zipCode, firstName, lastName }
    const response = await api.post('/users/create', userData);
    return response.data;
  },
};

export const userService = {
  updateUsername: async (currentPassword, newUsername) => {
    return api.patch('/users/update/username', {
      currentPassword,
      newUsername,
    });
  },

  updatePassword: async (currentPassword, newPassword) => {
    return api.patch('/users/update/password', {
      currentPassword,
      newPassword,
    });
  },

  deleteAccount: async () => {
    return api.delete('/users');
  },
};

export const animalService = {
  searchAnimals: async (filterParams = {}) => {
    // filterParams: { species, breed, minAge, maxAge, zipCode, etc. }
    const response = await api.post('/animals/search', filterParams);
    return response.data;
  },

  getAnimalById: async (id) => {
    const response = await api.get(`/animals/${id}`);
    return response.data;
  },
};

export const shelterService = {
  getAllShelters: async () => {
    const response = await api.get('/shelters');
    return response.data;
  },

  getShelterById: async (id) => {
    const response = await api.get(`/shelters/${id}`);
    return response.data;
  },
};

export const favoriteService = {
  getFavorites: async () => {
    const response = await api.get('/users/favorites');
    return response.data;
  },

  addFavorite: async (animalId) => {
    return api.post(`/users/favorites/${animalId}`);
  },

  removeFavorite: async (animalId) => {
    return api.delete(`/users/favorites/${animalId}`);
  },
};

export const feedbackService = {
  getShelterFeedback: async (shelterId) => {
    const response = await api.get(`/feedback/shelter/${shelterId}`);
    return response.data;
  },

  submitFeedback: async (shelterId, comment, rating = 5) => {
    const response = await api.post('/feedback', {
      shelterId,
      comment,
      rating,
    });
    return response.data;
  },
};

export default api;