import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout from '../components/common/SuperAdminLayout';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import flightService from '../services/flightService';
import airportService from '../services/airportService';
import airlineService from '../services/airlineService';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaFilter,
  FaPlane,
  FaClock,
  FaBan,
  FaExclamationTriangle
} from 'react-icons/fa';
import { formatTime, formatDate, calculateDuration, formatDuration } from '../utils/formatters';
import { FLIGHT_TYPES } from '../utils/constants';

const FlightsManagement = () => {
  const [flights, setFlights] = useState([]);
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    airportId: '',
    flightType: '',
    status: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Modal de création/édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [formData, setFormData] = useState({
    flightNumber: '',
    airlineId: '',
    aircraftType: '',
    departureAirportId: '',
    arrivalAirportId: '',
    scheduledDeparture: '',
    scheduledArrival: '',
    remarks: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal d'annulation
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [flightToCancel, setFlightToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Modal de retard
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [flightToDelay, setFlightToDelay] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState('');
  const [addingDelay, setAddingDelay] = useState(false);

  // Messages
  const [message, setMessage] = useState(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [flightsRes, airportsRes, airlinesRes] = await Promise.all([
        flightService.getAll(filters),
        airportService.getAll(),
        airlineService.getAll()
      ]);
      
      setFlights(flightsRes.data);
      setAirports(airportsRes.data);
      setAirlines(airlinesRes.data);
    } catch (error) {
      showMessage('error', error.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Gérer les changements de filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      search: '',
      airportId: '',
      flightType: '',
      status: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Ouvrir le modal de création
  const handleCreate = () => {
    setEditingFlight(null);
    setFormData({
      flightNumber: '',
      airlineId: '',
      aircraftType: '',
      departureAirportId: '',
      arrivalAirportId: '',
      scheduledDeparture: '',
      scheduledArrival: '',
      remarks: ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (flight) => {
    setEditingFlight(flight);
    setFormData({
      flightNumber: flight.flightNumber,
      airlineId: flight.airlineId._id,
      aircraftType: flight.aircraftType || '',
      departureAirportId: flight.departureAirportId._id,
      arrivalAirportId: flight.arrivalAirportId._id,
      scheduledDeparture: flight.scheduledDeparture.slice(0, 16),
      scheduledArrival: flight.scheduledArrival.slice(0, 16),
      remarks: flight.remarks || ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Gérer les changements du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};

    if (!formData.flightNumber.trim()) {
      errors.flightNumber = 'Le numéro de vol est obligatoire';
    } else if (!/^[A-Z0-9]{2,3}\d{1,4}$/i.test(formData.flightNumber)) {
      errors.flightNumber = 'Format invalide (ex: MD301)';
    }

    if (!formData.airlineId) {
      errors.airlineId = 'La compagnie est obligatoire';
    }

    if (!formData.departureAirportId) {
      errors.departureAirportId = 'L\'aéroport de départ est obligatoire';
    }

    if (!formData.arrivalAirportId) {
      errors.arrivalAirportId = 'L\'aéroport d\'arrivée est obligatoire';
    }

    if (formData.departureAirportId === formData.arrivalAirportId) {
      errors.arrivalAirportId = 'Les aéroports doivent être différents';
    }

    if (!formData.scheduledDeparture) {
      errors.scheduledDeparture = 'L\'heure de départ est obligatoire';
    }

    if (!formData.scheduledArrival) {
      errors.scheduledArrival = 'L\'heure d\'arrivée est obligatoire';
    }

    if (formData.scheduledDeparture && formData.scheduledArrival) {
      const departure = new Date(formData.scheduledDeparture);
      const arrival = new Date(formData.scheduledArrival);
      const diff = (arrival - departure) / 60000; // minutes

      if (diff < 15) {
        errors.scheduledArrival = 'L\'arrivée doit être au moins 15 minutes après le départ';
      }
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

      const dataToSend = {
        ...formData,
        scheduledDeparture: new Date(formData.scheduledDeparture).toISOString(),
        scheduledArrival: new Date(formData.scheduledArrival).toISOString()
      };

      if (editingFlight) {
        // Modification (seulement certains champs)
        const allowedUpdates = {
          scheduledDeparture: dataToSend.scheduledDeparture,
          scheduledArrival: dataToSend.scheduledArrival,
          aircraftType: dataToSend.aircraftType,
          remarks: dataToSend.remarks
        };
        await flightService.update(editingFlight._id, allowedUpdates);
        showMessage('success', 'Vol modifié avec succès');
      } else {
        // Création
        await flightService.create(dataToSend);
        showMessage('success', 'Vol créé avec succès (départ et arrivée)');
      }

      setModalOpen(false);
      loadData();
    } catch (error) {
      showMessage('error', error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer un vol
  const handleDeleteClick = (flight) => {
    setFlightToDelete(flight);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await flightService.delete(flightToDelete._id);
      showMessage('success', 'Vol supprimé avec succès (départ et arrivée)');
      setDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      showMessage('error', error.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // Annuler un vol
  const handleCancelClick = (flight) => {
    setFlightToCancel(flight);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim() || cancelReason.length < 5) {
      showMessage('error', 'La raison doit contenir au moins 5 caractères');
      return;
    }

    try {
      setCancelling(true);
      await flightService.cancel(flightToCancel._id, cancelReason);
      showMessage('success', 'Vol annulé avec succès');
      setCancelDialogOpen(false);
      loadData();
    } catch (error) {
      showMessage('error', error.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  // Ajouter un retard
  const handleDelayClick = (flight) => {
    setFlightToDelay(flight);
    setDelayMinutes('');
    setDelayDialogOpen(true);
  };

  const handleDelayConfirm = async () => {
    const minutes = parseInt(delayMinutes);
    
    if (!minutes || minutes <= 0) {
      showMessage('error', 'Le retard doit être supérieur à 0');
      return;
    }

    try {
      setAddingDelay(true);
      await flightService.addDelay(flightToDelay._id, minutes);
      showMessage('success', `Retard de ${minutes} minutes ajouté`);
      setDelayDialogOpen(false);
      loadData();
    } catch (error) {
      showMessage('error', error.message || 'Erreur lors de l\'ajout du retard');
    } finally {
      setAddingDelay(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Vols</h2>
            <p className="text-gray-600 mt-1">
              {flights.length} vol{flights.length > 1 ? 's' : ''} trouvé{flights.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <FaPlus />
            Nouveau Vol
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

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Filtres</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Rechercher par numéro..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Aéroport */}
            <select
              name="airportId"
              value={filters.airportId}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tous les aéroports</option>
              {airports.map(airport => (
                <option key={airport._id} value={airport._id}>
                  {airport.code} - {airport.city}
                </option>
              ))}
            </select>

            {/* Type de vol */}
            <select
              name="flightType"
              value={filters.flightType}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Départs et Arrivées</option>
              <option value="departure">Départs uniquement</option>
              <option value="arrival">Arrivées uniquement</option>
            </select>

            {/* Statut */}
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="scheduled">Prévus</option>
              <option value="boarding">Embarquement</option>
              <option value="departed">Décollés</option>
              <option value="in_air">En vol</option>
              <option value="landed">Atterris</option>
              <option value="delayed">Retardés</option>
              <option value="cancelled">Annulés</option>
            </select>

            {/* Date */}
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Tableau des vols */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : flights.length === 0 ? (
            <div className="text-center py-12">
              <FaPlane className="mx-auto text-gray-400 text-5xl mb-4" />
              <p className="text-gray-500">Aucun vol trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Compagnie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trajet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Horaires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Durée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flights.map((flight) => {
                    const duration = calculateDuration(
                      flight.scheduledDeparture,
                      flight.scheduledArrival
                    );

                    return (
                      <tr key={flight._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-semibold text-primary-600">
                              {flight.flightNumber}
                            </div>
                            {flight.aircraftType && (
                              <div className="text-xs text-gray-500">
                                {flight.aircraftType}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-2xl" title={FLIGHT_TYPES[flight.flightType].label}>
                            {FLIGHT_TYPES[flight.flightType].icon}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {flight.airlineId.logo ? (
                              <img 
                                src={flight.airlineId.logo} 
                                alt={flight.airlineId.name}
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                <FaPlane className="text-gray-400 text-xs" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{flight.airlineId.code}</div>
                              <div className="text-xs text-gray-500">{flight.airlineId.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-semibold">{flight.departureAirportId.code}</div>
                              <div className="text-xs text-gray-500">{flight.departureAirportId.city}</div>
                            </div>
                            <div className="text-gray-400">→</div>
                            <div>
                              <div className="font-semibold">{flight.arrivalAirportId.code}</div>
                              <div className="text-xs text-gray-500">{flight.arrivalAirportId.city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center gap-1 text-sm">
                              <FaClock className="text-gray-400" />
                              <span className="font-medium">{formatTime(flight.scheduledDeparture)}</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium">{formatTime(flight.scheduledArrival)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(flight.scheduledDeparture)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {formatDuration(duration)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <StatusBadge status={flight.status} withIcon />
                            {flight.delayMinutes > 0 && (
                              <div className="text-xs text-orange-600 mt-1">
                                +{flight.delayMinutes} min
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Bouton Modifier */}
                            {!['departed', 'in_air', 'landed', 'cancelled'].includes(flight.status) && (
                              <button
                                onClick={() => handleEdit(flight)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Modifier"
                              >
                                <FaEdit />
                              </button>
                            )}

                            {/* Bouton Retard */}
                            {['scheduled', 'boarding'].includes(flight.status) && (
                              <button
                                onClick={() => handleDelayClick(flight)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                title="Ajouter un retard"
                              >
                                <FaClock />
                              </button>
                            )}

                            {/* Bouton Annuler */}
                            {!['departed', 'in_air', 'landed', 'cancelled'].includes(flight.status) && (
                              <button
                                onClick={() => handleCancelClick(flight)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Annuler le vol"
                              >
                                <FaBan />
                              </button>
                            )}

                            {/* Bouton Supprimer */}
                            {flight.status === 'scheduled' && (
                              <button
                                onClick={() => handleDeleteClick(flight)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Supprimer"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        title={editingFlight ? 'Modifier le vol' : 'Nouveau vol'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Numéro de vol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de vol <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="flightNumber"
                value={formData.flightNumber}
                onChange={handleChange}
                disabled={!!editingFlight}
                placeholder="MD301"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase ${
                  formErrors.flightNumber ? 'border-red-500' : 'border-gray-300'
                } ${editingFlight ? 'bg-gray-100' : ''}`}
              />
              {formErrors.flightNumber && (
                <p className="mt-1 text-sm text-red-600">{formErrors.flightNumber}</p>
              )}
            </div>

            {/* Compagnie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compagnie <span className="text-red-500">*</span>
              </label>
              <select
                name="airlineId"
                value={formData.airlineId}
                onChange={handleChange}
                disabled={!!editingFlight}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  formErrors.airlineId ? 'border-red-500' : 'border-gray-300'
                } ${editingFlight ? 'bg-gray-100' : ''}`}
              >
                <option value="">Sélectionner une compagnie</option>
                {airlines.filter(a => a.isActive).map(airline => (
                  <option key={airline._id} value={airline._id}>
                    {airline.code} - {airline.name}
                  </option>
                ))}
              </select>
              {formErrors.airlineId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.airlineId}</p>
              )}
            </div>

            {/* Type d'avion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'avion
              </label>
              <input
                type="text"
                name="aircraftType"
                value={formData.aircraftType}
                onChange={handleChange}
                placeholder="ATR72, Boeing 737..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Aéroport de départ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aéroport de départ <span className="text-red-500">*</span>
              </label>
              <select
                name="departureAirportId"
                value={formData.departureAirportId}
                onChange={handleChange}
                disabled={!!editingFlight}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  formErrors.departureAirportId ? 'border-red-500' : 'border-gray-300'
                } ${editingFlight ? 'bg-gray-100' : ''}`}
              >
                <option value="">Sélectionner un aéroport</option>
                {airports.filter(a => a.isActive).map(airport => (
                  <option key={airport._id} value={airport._id}>
                    {airport.code} - {airport.name} ({airport.city})
                  </option>
                ))}
              </select>
              {formErrors.departureAirportId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.departureAirportId}</p>
              )}
            </div>

            {/* Aéroport d'arrivée */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aéroport d'arrivée <span className="text-red-500">*</span>
              </label>
              <select
                name="arrivalAirportId"
                value={formData.arrivalAirportId}
                onChange={handleChange}
                disabled={!!editingFlight}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  formErrors.arrivalAirportId ? 'border-red-500' : 'border-gray-300'
                } ${editingFlight ? 'bg-gray-100' : ''}`}
              >
                <option value="">Sélectionner un aéroport</option>
                {airports.filter(a => a.isActive).map(airport => (
                  <option key={airport._id} value={airport._id}>
                    {airport.code} - {airport.name} ({airport.city})
                  </option>
                ))}
              </select>
              {formErrors.arrivalAirportId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.arrivalAirportId}</p>
              )}
            </div>

            {/* Heure de départ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure de départ <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduledDeparture"
                value={formData.scheduledDeparture}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  formErrors.scheduledDeparture ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.scheduledDeparture && (
                <p className="mt-1 text-sm text-red-600">{formErrors.scheduledDeparture}</p>
              )}
            </div>

            {/* Heure d'arrivée */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure d'arrivée <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduledArrival"
                value={formData.scheduledArrival}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  formErrors.scheduledArrival ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.scheduledArrival && (
                <p className="mt-1 text-sm text-red-600">{formErrors.scheduledArrival}</p>
              )}
            </div>
          </div>

          {/* Remarques */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarques
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Informations complémentaires..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Note importante */}
          {!editingFlight && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> La création de ce vol générera automatiquement un vol d'arrivée 
                correspondant à l'aéroport de destination.
              </p>
            </div>
          )}

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
                editingFlight ? 'Modifier' : 'Créer'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dialogue de suppression */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le vol"
        message={`Êtes-vous sûr de vouloir supprimer le vol ${flightToDelete?.flightNumber} ? Cette action supprimera également le vol d'arrivée lié et est irréversible.`}
        confirmText="Supprimer"
        isLoading={deleting}
      />

      {/* Dialogue d'annulation */}
      <Modal
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Annuler le vol"
        size="sm"
      >
        <div>
          <div className="mb-4 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <FaExclamationTriangle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-gray-700 mb-2">
              Voulez-vous annuler le vol <strong>{flightToCancel?.flightNumber}</strong> ?
            </p>
            <p className="text-sm text-gray-500">
              Cette action annulera également le vol d'arrivée lié.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raison de l'annulation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Ex: Conditions météorologiques défavorables"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 5 caractères</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelling}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Fermer
            </button>
            <button
              onClick={handleCancelConfirm}
              disabled={cancelling || !cancelReason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {cancelling ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                'Annuler le vol'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Dialogue de retard */}
      <Modal
        isOpen={delayDialogOpen}
        onClose={() => setDelayDialogOpen(false)}
        title="Ajouter un retard"
        size="sm"
      >
        <div>
          <div className="mb-4 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
              <FaClock className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-gray-700 mb-2">
              Ajouter un retard au vol <strong>{flightToDelay?.flightNumber}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Le retard sera appliqué aux deux vols (départ et arrivée).
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Retard (en minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(e.target.value)}
              min="1"
              max="1440"
              placeholder="30"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Entre 1 et 1440 minutes (24h)</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDelayDialogOpen(false)}
              disabled={addingDelay}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleDelayConfirm}
              disabled={addingDelay || !delayMinutes}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {addingDelay ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                'Ajouter le retard'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </SuperAdminLayout>
  );
};

export default FlightsManagement;