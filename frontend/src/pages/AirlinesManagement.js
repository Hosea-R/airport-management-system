import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout from '../components/common/SuperAdminLayout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import airlineService from '../services/airlineService';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaPlane
} from 'react-icons/fa';

const AirlinesManagement = () => {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  
  // Modal de création/édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAirline, setEditingAirline] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    logo: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [airlineToDelete, setAirlineToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Messages
  const [message, setMessage] = useState(null);

 // Enveloppez loadAirlines dans useCallback
  const loadAirlines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await airlineService.getAll();
      setAirlines(response.data);
    } catch (error) {
      showMessage('error', error.message || 'Erreur de chargement des compagnies');
    } finally {
      setLoading(false);
    }
  }, []); // Dépendances vides

    // Charger les compagnies
  useEffect(() => {
    loadAirlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Filtrer les compagnies
  const filteredAirlines = airlines.filter((airline) => {
    const matchSearch = 
      airline.code.toLowerCase().includes(search.toLowerCase()) ||
      airline.name.toLowerCase().includes(search.toLowerCase());

    const matchFilter = 
      filterActive === 'all' ||
      (filterActive === 'active' && airline.isActive) ||
      (filterActive === 'inactive' && !airline.isActive);

    return matchSearch && matchFilter;
  });

  // Ouvrir le modal de création
  const handleCreate = () => {
    setEditingAirline(null);
    setFormData({
      code: '',
      name: '',
      logo: '',
      isActive: true
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (airline) => {
    setEditingAirline(airline);
    setFormData({
      code: airline.code,
      name: airline.name,
      logo: airline.logo || '',
      isActive: airline.isActive
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
    } else if (!/^[A-Z0-9]{2}$/i.test(formData.code)) {
      errors.code = 'Le code IATA doit contenir 2 caractères (lettres ou chiffres)';
    }

    if (!formData.name.trim()) {
      errors.name = 'Le nom est obligatoire';
    }

    if (formData.logo && !/^https?:\/\/.+/.test(formData.logo)) {
      errors.logo = 'Le logo doit être une URL valide';
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

      // Préparer les données (logo vide = null)
      const dataToSend = {
        ...formData,
        logo: formData.logo.trim() || null
      };

      if (editingAirline) {
        // Modification
        await airlineService.update(editingAirline._id, dataToSend);
        showMessage('success', 'Compagnie modifiée avec succès');
      } else {
        // Création
        await airlineService.create(dataToSend);
        showMessage('success', 'Compagnie créée avec succès');
      }

      setModalOpen(false);
      loadAirlines();
    } catch (error) {
      showMessage('error', error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir le dialogue de suppression
  const handleDeleteClick = (airline) => {
    setAirlineToDelete(airline);
    setDeleteDialogOpen(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await airlineService.delete(airlineToDelete._id);
      showMessage('success', 'Compagnie supprimée avec succès');
      setDeleteDialogOpen(false);
      loadAirlines();
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
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Compagnies Aériennes</h2>
            <p className="text-gray-600 mt-1">
              {airlines.length} compagnie{airlines.length > 1 ? 's' : ''} enregistrée{airlines.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <FaPlus />
            Nouvelle Compagnie
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
                placeholder="Rechercher par code ou nom..."
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
              <option value="active">Actives uniquement</option>
              <option value="inactive">Inactives uniquement</option>
            </select>
          </div>
        </div>

        {/* Tableau des compagnies */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredAirlines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune compagnie trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Logo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
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
                  {filteredAirlines.map((airline) => (
                    <tr key={airline._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {airline.logo ? (
                          <img 
                            src={airline.logo} 
                            alt={airline.name}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center"
                          style={{ display: airline.logo ? 'none' : 'flex' }}
                        >
                          <FaPlane className="text-primary-600" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-primary-600">
                          {airline.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {airline.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {airline.isActive ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <FaCheckCircle />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <FaTimesCircle />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(airline)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(airline)}
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
        title={editingAirline ? 'Modifier la compagnie' : 'Nouvelle compagnie'}
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
              maxLength={2}
              placeholder="MD"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase ${
                formErrors.code ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.code && (
              <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              2 caractères (lettres ou chiffres)
            </p>
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
              placeholder="Air Madagascar"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo (URL)
            </label>
            <input
              type="text"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                formErrors.logo ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.logo && (
              <p className="mt-1 text-sm text-red-600">{formErrors.logo}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optionnel - URL complète du logo (sera utilisé en Phase 6 avec Imgur)
            </p>
          </div>

          {/* Checkbox Actif */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Compagnie active</span>
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
                editingAirline ? 'Modifier' : 'Créer'
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
        title="Supprimer la compagnie"
        message={`Êtes-vous sûr de vouloir supprimer la compagnie ${airlineToDelete?.name} (${airlineToDelete?.code}) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        isLoading={deleting}
      />
    </SuperAdminLayout>
  );
};

export default AirlinesManagement;