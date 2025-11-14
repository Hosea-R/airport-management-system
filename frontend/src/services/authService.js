import api from './api';

/**
 * Service d'authentification
 */
const authService = {
  /**
   * Connexion
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Stocker le token et les infos utilisateur
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de connexion' };
    }
  },

  /**
   * Déconnexion
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Supprimer les données locales même en cas d'erreur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Récupérer l'utilisateur connecté
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data.user;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de récupération utilisateur' };
    }
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Récupérer l'utilisateur depuis localStorage
   */
  getUserFromStorage: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export default authService;