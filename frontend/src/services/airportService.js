import api from './api';

const airportService = {
  /**
   * Récupérer tous les aéroports
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/airports', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de récupération des aéroports' };
    }
  },

  /**
   * Récupérer un aéroport par ID
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/airports/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de récupération de l\'aéroport' };
    }
  },

  /**
   * Créer un aéroport
   */
  create: async (airportData) => {
    try {
      const response = await api.post('/airports', airportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de création de l\'aéroport' };
    }
  },

  /**
   * Modifier un aéroport
   */
  update: async (id, airportData) => {
    try {
      const response = await api.patch(`/airports/${id}`, airportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de modification de l\'aéroport' };
    }
  },

  /**
   * Supprimer un aéroport
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/airports/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de suppression de l\'aéroport' };
    }
  }
};

export default airportService;