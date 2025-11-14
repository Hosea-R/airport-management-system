import axios from 'axios';

/**
 * Instance Axios configurée pour l'API
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Intercepteur de requête : Ajoute automatiquement le token JWT
 */
api.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur de réponse : Gérer les erreurs globalement
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si erreur 401 (non autorisé), déconnecter l'utilisateur
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;