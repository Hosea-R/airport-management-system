import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/common/Modal";
// import ConfirmDialog from "../components/common/ConfirmDialog";
import StatusBadge from "../components/common/StatusBadge";
import flightService from "../services/flightService";
import airportService from "../services/airportService";
import airlineService from "../services/airlineService";
import {
  FaPlus,
  // FaEdit,
  FaSearch,
  FaPlane,
  FaClock,
  FaBan,
  FaSignOutAlt,
  FaPlaneDeparture,
  FaPlaneArrival,
} from "react-icons/fa";
import {
  formatTime,
  formatDate,
  calculateDuration,
  formatDuration,
} from "../utils/formatters";

const RegionalFlightsManagement = () => {
  const { user, logout } = useAuth();
  const [flights, setFlights] = useState([]);
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("departures"); // departures, arrivals, all

  // Filtres
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Modal de création
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    flightNumber: "",
    airlineId: "",
    aircraftType: "",
    arrivalAirportId: "",
    scheduledDeparture: "",
    scheduledArrival: "",
    remarks: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal d'annulation
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [flightToCancel, setFlightToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Modal de retard
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [flightToDelay, setFlightToDelay] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState("");
  const [addingDelay, setAddingDelay] = useState(false);

  // Messages
  const [message, setMessage] = useState(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      // Ajouter cette vérification
      const airportId = user?.airportId?._id;
      if (!airportId) {
        setLoading(false); // Arrêter le chargement
        return; // Ne rien faire si on n'a pas l'ID
      }

      setLoading(true);

      const queryParams = {
        airportId: airportId, // Utiliser la variable vérifiée
        ...filters,
      };

      // Filtrer par type selon l'onglet actif
      if (activeTab === "departures") {
        queryParams.flightType = "departure";
      } else if (activeTab === "arrivals") {
        queryParams.flightType = "arrival";
      }

      const [flightsRes, airportsRes, airlinesRes] = await Promise.all([
        flightService.getAll(queryParams),
        airportService.getAll(),
        airlineService.getAll(),
      ]);

      setFlights(flightsRes.data);
      setAirports(airportsRes.data);
      setAirlines(airlinesRes.data);
    } catch (error) {
      showMessage("error", error.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab, user?.airportId?._id]);

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
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Ouvrir le modal de création (uniquement départs)
  const handleCreate = () => {
    setFormData({
      flightNumber: "",
      airlineId: "",
      aircraftType: "",
      arrivalAirportId: "",
      scheduledDeparture: "",
      scheduledArrival: "",
      remarks: "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Gérer les changements du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};

    if (!formData.flightNumber.trim()) {
      errors.flightNumber = "Le numéro de vol est obligatoire";
    } else if (!/^[A-Z0-9]{2,3}\d{1,4}$/i.test(formData.flightNumber)) {
      errors.flightNumber = "Format invalide (ex: MD301)";
    }

    if (!formData.airlineId) {
      errors.airlineId = "La compagnie est obligatoire";
    }

    if (!formData.arrivalAirportId) {
      errors.arrivalAirportId = "L'aéroport d'arrivée est obligatoire";
    }

    if (formData.arrivalAirportId === user?.airportId?._id) {
      errors.arrivalAirportId =
        "L'aéroport d'arrivée doit être différent de votre aéroport";
    }

    if (!formData.scheduledDeparture) {
      errors.scheduledDeparture = "L'heure de départ est obligatoire";
    }

    if (!formData.scheduledArrival) {
      errors.scheduledArrival = "L'heure d'arrivée est obligatoire";
    }

    if (formData.scheduledDeparture && formData.scheduledArrival) {
      const departure = new Date(formData.scheduledDeparture);
      const arrival = new Date(formData.scheduledArrival);
      const diff = (arrival - departure) / 60000;

      if (diff < 15) {
        errors.scheduledArrival =
          "L'arrivée doit être au moins 15 minutes après le départ";
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
        flightNumber: formData.flightNumber,
        airlineId: formData.airlineId,
        aircraftType: formData.aircraftType,
        departureAirportId: user?.airportId?._id, // Toujours l'aéroport de l'admin
        arrivalAirportId: formData.arrivalAirportId,
        scheduledDeparture: new Date(formData.scheduledDeparture).toISOString(),
        scheduledArrival: new Date(formData.scheduledArrival).toISOString(),
        remarks: formData.remarks,
      };

      await flightService.create(dataToSend);
      showMessage("success", "Vol créé avec succès");
      setModalOpen(false);
      loadData();
    } catch (error) {
      showMessage("error", error.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  // Annuler un vol
  const handleCancelClick = (flight) => {
    setFlightToCancel(flight);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim() || cancelReason.length < 5) {
      showMessage("error", "La raison doit contenir au moins 5 caractères");
      return;
    }

    try {
      setCancelling(true);
      await flightService.cancel(flightToCancel._id, cancelReason);
      showMessage("success", "Vol annulé avec succès");
      setCancelDialogOpen(false);
      loadData();
    } catch (error) {
      showMessage("error", error.message || "Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  };

  // Ajouter un retard
  const handleDelayClick = (flight) => {
    setFlightToDelay(flight);
    setDelayMinutes("");
    setDelayDialogOpen(true);
  };

  const handleDelayConfirm = async () => {
    const minutes = parseInt(delayMinutes);

    if (!minutes || minutes <= 0) {
      showMessage("error", "Le retard doit être supérieur à 0");
      return;
    }

    try {
      setAddingDelay(true);
      await flightService.addDelay(flightToDelay._id, minutes);
      showMessage("success", `Retard de ${minutes} minutes ajouté`);
      setDelayDialogOpen(false);
      loadData();
    } catch (error) {
      showMessage("error", error.message || "Erreur lors de l'ajout du retard");
    } finally {
      setAddingDelay(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
                <FaPlane />
                Gestion des Vols
              </h1>
              <p className="text-sm text-gray-600">
                {user?.airport?.name} ({user?.airport?.code}) -{" "}
                {user?.airport?.city}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">Admin Régional</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <FaSignOutAlt />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* En-tête avec bouton */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mes Vols</h2>
              <p className="text-gray-600 text-sm mt-1">
                {flights.length} vol{flights.length > 1 ? "s" : ""} trouvé
                {flights.length > 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <FaPlus />
              Créer un Départ
            </button>
          </div>

          {/* Message de feedback */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Onglets */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("departures")}
                  className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
                    activeTab === "departures"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FaPlaneDeparture />
                  Départs
                </button>
                <button
                  onClick={() => setActiveTab("arrivals")}
                  className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
                    activeTab === "arrivals"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FaPlaneArrival />
                  Arrivées Attendues
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
                    activeTab === "all"
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FaPlane />
                  Tous
                </button>
              </div>
            </div>

            {/* Filtres */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>

            {/* Liste des vols */}
            <div className="p-4">
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
                <div className="space-y-4">
                  {flights.map((flight) => {
                    const duration = calculateDuration(
                      flight.scheduledDeparture,
                      flight.scheduledArrival
                    );

                    return (
                      <div
                        key={flight._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          {/* Informations principales */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {/* Logo compagnie */}
                              {flight.airlineId.logo ? (
                                <img
                                  src={flight.airlineId.logo}
                                  alt={flight.airlineId.name}
                                  className="w-12 h-12 object-contain"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                  <FaPlane className="text-gray-400" />
                                </div>
                              )}

                              {/* Numéro de vol et compagnie */}
                              <div>
                                <h3 className="text-xl font-bold text-primary-600">
                                  {flight.flightNumber}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {flight.airlineId.name}
                                  {flight.aircraftType &&
                                    ` • ${flight.aircraftType}`}
                                </p>
                              </div>

                              {/* Badge statut */}
                              <StatusBadge status={flight.status} withIcon />
                            </div>

                            {/* Trajet */}
                            <div className="flex items-center gap-4 mb-3">
                              <div className="text-center">
                                <div className="text-2xl font-bold">
                                  {flight.departureAirportId.code}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {flight.departureAirportId.city}
                                </div>
                                <div className="text-sm font-medium mt-1">
                                  {formatTime(flight.scheduledDeparture)}
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col items-center">
                                <div className="text-xs text-gray-500 mb-1">
                                  {formatDuration(duration)}
                                </div>
                                <div className="w-full h-0.5 bg-gray-300 relative">
                                  <FaPlane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-600 bg-white px-1" />
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(flight.scheduledDeparture)}
                                </div>
                              </div>

                              <div className="text-center">
                                <div className="text-2xl font-bold">
                                  {flight.arrivalAirportId.code}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {flight.arrivalAirportId.city}
                                </div>
                                <div className="text-sm font-medium mt-1">
                                  {formatTime(flight.scheduledArrival)}
                                </div>
                              </div>
                            </div>

                            {/* Infos supplémentaires */}
                            {flight.delayMinutes > 0 && (
                              <div className="text-sm text-orange-600 mb-2">
                                ⚠️ Retard de {flight.delayMinutes} minutes
                              </div>
                            )}

                            {flight.cancellationReason && (
                              <div className="text-sm text-red-600 mb-2">
                                ❌ Annulé : {flight.cancellationReason}
                              </div>
                            )}

                            {flight.remarks && (
                              <div className="text-sm text-gray-600">
                                💬 {flight.remarks}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 ml-4">
                            {/* Retard */}
                            {["scheduled", "boarding"].includes(
                              flight.status
                            ) &&
                              flight.flightType === "departure" && (
                                <button
                                  onClick={() => handleDelayClick(flight)}
                                  className="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition flex items-center gap-2"
                                >
                                  <FaClock />
                                  Retard
                                </button>
                              )}

                            {/* Annuler */}
                            {![
                              "departed",
                              "in_air",
                              "landed",
                              "cancelled",
                            ].includes(flight.status) &&
                              flight.flightType === "departure" && (
                                <button
                                  onClick={() => handleCancelClick(flight)}
                                  className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center gap-2"
                                >
                                  <FaBan />
                                  Annuler
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Créer un vol au départ"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Aéroport de départ :</strong> {user?.airport?.name} (
              {user?.airport?.code})
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Un vol d'arrivée sera automatiquement créé à l'aéroport de
              destination.
            </p>
          </div>

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
                placeholder="MD301"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase ${
                  formErrors.flightNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.flightNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.flightNumber}
                </p>
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  formErrors.airlineId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Sélectionner une compagnie</option>
                {airlines
                  .filter((a) => a.isActive)
                  .map((airline) => (
                    <option key={airline._id} value={airline._id}>
                      {airline.code} - {airline.name}
                    </option>
                  ))}
              </select>
              {formErrors.airlineId && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.airlineId}
                </p>
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

            {/* Aéroport d'arrivée */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aéroport d'arrivée <span className="text-red-500">*</span>
              </label>
              <select
                name="arrivalAirportId"
                value={formData.arrivalAirportId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  formErrors.arrivalAirportId
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="">Sélectionner un aéroport</option>
                {airports
                  .filter((a) => a.isActive && a._id !== user?.airportId._id)
                  .map((airport) => (
                    <option key={airport._id} value={airport._id}>
                      {airport.code} - {airport.name} ({airport.city})
                    </option>
                  ))}
              </select>
              {formErrors.arrivalAirportId && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.arrivalAirportId}
                </p>
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
                  formErrors.scheduledDeparture
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.scheduledDeparture && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.scheduledDeparture}
                </p>
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
                  formErrors.scheduledArrival
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.scheduledArrival && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.scheduledArrival}
                </p>
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
                "Créer le vol"
              )}
            </button>
          </div>
        </form>
      </Modal>

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
              <FaBan className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-gray-700 mb-2">
              Voulez-vous annuler le vol{" "}
              <strong>{flightToCancel?.flightNumber}</strong> ?
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
                "Annuler le vol"
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
              Ajouter un retard au vol{" "}
              <strong>{flightToDelay?.flightNumber}</strong>
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
            <p className="mt-1 text-xs text-gray-500">
              Entre 1 et 1440 minutes (24h)
            </p>
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
                "Ajouter le retard"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegionalFlightsManagement;
