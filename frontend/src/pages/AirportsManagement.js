import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout from '../components/common/SuperAdminLayout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import airportService from '../services/airportService';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaStar
} from 'react-icons/fa';

const AirportsManagement = () => {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  
  // Modal de création/édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAirport, setEditingAirport] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    city: '',
    region: '',
    isActive: true,
    isCentral: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [airportToDelete, setAirportToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Messages
  const [message, setMessage] = useState(null);

// Enveloppez loadAirports dans useCallback
  const loadAirports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await airportService.getAll();
      setAirports(response.data);
    } catch (error) {
      showMessage('error', error.message || 'Erreur de chargement des aéroports');
    } finally {
      setLoading(false);
    }
  }, []); 

    // Charger les aéroports
  useEffect(() => {
    loadAirports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Filtrer les aéroports
  const filteredAirports = airports.filter((airport) => {
    const matchSearch = 
      airport.code.toLowerCase().includes(search.toLowerCase()) ||
      airport.name.toLowerCase().includes(search.toLowerCase()) ||
      airport.city.toLowerCase().includes(search.toLowerCase());

    const matchFilter = 
      filterActive === 'all' ||
      (filterActive === 'active' && airport.isActive) ||
      (filterActive === 'inactive' && !airport.isActive);

    return matchSearch && matchFilter;
  });

  // Ouvrir le modal de création
  const handleCreate = () => {
    setEditingAirport(null);
    setFormData({
      code: '',
      name: '',
      city: '',
      region: '',
      isActive: true,
      isCentral: false
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (airport) => {
    setEditingAirport(airport);
    setFormData({
      code: airport.code,
      name: airport.name,
      city: airport.city,
      region: airport.region,
      isActive: airport.isActive,
      isCentral: airport.isCentral
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Gérer les changements du formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Effacer l'erreur du champ
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};

    if (!formData.code.trim()) {
      errors.code = 'Le code IATA est obligatoire';
    } else if (!/^[A-Z]{3}$/i.test(formData.code)) {
      errors.code = 'Le code IATA doit contenir 3 lettres';
    }

    if (!formData.name.trim()) {
      errors.name = 'Le nom est obligatoire';
    }

    if (!formData.city.trim()) {
      errors.city = 'La ville est obligatoire';
    }

    if (!formData.region.trim()) {
      errors.region = 'La région est obligatoire';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (editingAirport) {
        // Modification
        await airportService.update(editingAirport._id, formData);
        showMessage('success', 'Aéroport modifié avec succès');
      } else {
        // Création
        await airportService.create(formData);
        showMessage('success', 'Aéroport créé avec succès');
      }

      setModalOpen(false);
      loadAirports();
    } catch (error) {
      showMessage('error', error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir le dialogue de suppression
  const handleDeleteClick = (airport) => {
    setAirportToDelete(airport);
    setDeleteDialogOpen(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await airportService.delete(airportToDelete._id);
      showMessage('success', 'Aéroport supprimé avec succès');
      setDeleteDialogOpen(false);
      loadAirports();
    } catch (error) {
      showMessage('error', error.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Aéroports</h2>
            <p className="text-gray-600 mt-1">
              {airports.length} aéroport{airports.length > 1 ? 's' : ''} enregistré{airports.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <FaPlus />
            Nouvel Aéroport
          </button>
        </div>

        {/* Message de feedback */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par code, nom ou ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filtre statut */}
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs uniquement</option>
            </select>
          </div>
        </div>

        {/* Tableau des aéroports */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredAirports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun aéroport trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ville
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Région
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAirports.map((airport) => (
                    <tr key={airport._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-primary-600">
                          {airport.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {airport.name}
                          {airport.isCentral && (
                            <FaStar className="text-yellow-500" title="Aéroport central" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {airport.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {airport.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {airport.isCentral ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Central
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Régional
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {airport.isActive ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <FaCheckCircle />
                            Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <FaTimesCircle />
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(airport)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(airport)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création/édition */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAirport ? 'Modifier l\'aéroport' : 'Nouvel aéroport'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code IATA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code IATA <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              maxLength={3}
              placeholder="TNR"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase ${
                formErrors.code ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.code && (
              <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ivato"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* Ville */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Antananarivo"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                formErrors.city ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.city && (
              <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
            )}
          </div>

          {/* Région */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Région <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleChange}
              placeholder="Analamanga"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                formErrors.region ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.region && (
              <p className="mt-1 text-sm text-red-600">{formErrors.region}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Aéroport actif</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isCentral"
                checked={formData.isCentral}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Aéroport central (Antananarivo)</span>
            </label>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                editingAirport ? 'Modifier' : 'Créer'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dialogue de confirmation de suppression */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'aéroport"
        message={`Êtes-vous sûr de vouloir supprimer l'aéroport ${airportToDelete?.name} (${airportToDelete?.code}) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        isLoading={deleting}
      />
    </SuperAdminLayout>
  );
};

export default AirportsManagement;