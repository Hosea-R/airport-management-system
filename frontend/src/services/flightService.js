import api from './api';

const flightService = {
  /**
   * Récupérer tous les vols avec filtres
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/flights', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de récupération des vols' };
    }
  },

  /**
   * Récupérer un vol par ID
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/flights/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de récupération du vol' };
    }
  },

  /**
   * Créer un vol
   */
  create: async (flightData) => {
    try {
      const response = await api.post('/flights', flightData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de création du vol' };
    }
  },

  /**
   * Modifier un vol
   */
  update: async (id, flightData) => {
    try {
      const response = await api.patch(`/flights/${id}`, flightData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de modification du vol' };
    }
  },

  /**
   * Changer le statut d'un vol
   */
  changeStatus: async (id, status, additionalData = {}) => {
    try {
      const response = await api.patch(`/flights/${id}/status`, {
        status,
        additionalData
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de changement de statut' };
    }
  },

  /**
   * Annuler un vol
   */
  cancel: async (id, reason) => {
    try {
      const response = await api.post(`/flights/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur d\'annulation du vol' };
    }
  },

  /**
   * Ajouter un retard
   */
  addDelay: async (id, delayMinutes) => {
    try {
      const response = await api.post(`/flights/${id}/delay`, { delayMinutes });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur d\'ajout de retard' };
    }
  },

  /**
   * Supprimer un vol
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/flights/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de suppression du vol' };
    }
  }
};

export default flightService;