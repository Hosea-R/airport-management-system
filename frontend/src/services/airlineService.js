import api from './api';

const airlineService = {
  /**
   * Récupérer toutes les compagnies
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/airlines', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de récupération des compagnies' };
    }
  },

  /**
   * Récupérer une compagnie par ID
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/airlines/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de récupération de la compagnie' };
    }
  },

  /**
   * Créer une compagnie
   */
  create: async (airlineData) => {
    try {
      const response = await api.post('/airlines', airlineData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de création de la compagnie' };
    }
  },

  /**
   * Modifier une compagnie
   */
  update: async (id, airlineData) => {
    try {
      const response = await api.patch(`/airlines/${id}`, airlineData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de modification de la compagnie' };
    }
  },

  /**
   * Supprimer une compagnie
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/airlines/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de suppression de la compagnie' };
    }
  }
};

export default airlineService;