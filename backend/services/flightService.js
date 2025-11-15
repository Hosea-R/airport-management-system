const Flight = require('../models/Flight');
const Airport = require('../models/Airport');
const Airline = require('../models/Airline');

/**
 * Service pour la logique métier des vols
 * Gère la création bidirectionnelle et la synchronisation
 */

/**
 * Créer un vol avec son jumeau automatiquement
 * @param {Object} flightData - Données du vol
 * @param {ObjectId} userId - ID de l'utilisateur créateur
 * @param {ObjectId} createdAirportId - ID de l'aéroport créateur
 * @returns {Object} - Les deux vols créés (départ et arrivée)
 */
const createFlightWithLinked = async (flightData, userId, createdAirportId) => {
  const {
    flightNumber,
    airlineId,
    aircraftType,
    departureAirportId,
    arrivalAirportId,
    scheduledDeparture,
    scheduledArrival,
    remarks
  } = flightData;

  // 1. Validations métier
  await validateFlightCreation({
    departureAirportId,
    arrivalAirportId,
    airlineId,
    scheduledDeparture,
    scheduledArrival,
    flightNumber
  });

  // 2. Créer le vol DÉPART
  const departureFlight = new Flight({
    flightNumber,
    airlineId,
    aircraftType,
    departureAirportId,
    arrivalAirportId,
    scheduledDeparture,
    scheduledArrival,
    actualDeparture: null,
    actualArrival: null,
    status: 'scheduled',
    flightType: 'departure',
    linkedFlightId: null, // Sera mis à jour après
    delayMinutes: 0,
    cancellationReason: null,
    remarks,
    createdBy: userId,
    createdAirportId,
    isArchived: false
  });

  // 3. Créer le vol ARRIVÉE
  const arrivalFlight = new Flight({
    flightNumber,
    airlineId,
    aircraftType,
    departureAirportId,
    arrivalAirportId,
    scheduledDeparture,
    scheduledArrival,
    actualDeparture: null,
    actualArrival: null,
    status: 'scheduled',
    flightType: 'arrival',
    linkedFlightId: null, // Sera mis à jour après
    delayMinutes: 0,
    cancellationReason: null,
    remarks,
    createdBy: userId,
    createdAirportId,
    isArchived: false
  });

  // 4. Lier les deux vols
  departureFlight.linkedFlightId = arrivalFlight._id;
  arrivalFlight.linkedFlightId = departureFlight._id;

  // 5. Sauvegarder les deux vols
  await departureFlight.save();
  await arrivalFlight.save();

  // 6. Populer les références
  await departureFlight.populate([
    { path: 'airlineId', select: 'code name logo' },
    { path: 'departureAirportId', select: 'code name city' },
    { path: 'arrivalAirportId', select: 'code name city' }
  ]);

  await arrivalFlight.populate([
    { path: 'airlineId', select: 'code name logo' },
    { path: 'departureAirportId', select: 'code name city' },
    { path: 'arrivalAirportId', select: 'code name city' }
  ]);

  return {
    departureFlight,
    arrivalFlight
  };
};

/**
 * Valider la création d'un vol
 */
const validateFlightCreation = async (data) => {
  const {
    departureAirportId,
    arrivalAirportId,
    airlineId,
    scheduledDeparture,
    scheduledArrival,
    flightNumber
  } = data;

  // Vérifier que les aéroports existent et sont actifs
  const departureAirport = await Airport.findById(departureAirportId);
  if (!departureAirport) {
    throw new Error('Aéroport de départ introuvable');
  }
  if (!departureAirport.isActive) {
    throw new Error('Aéroport de départ inactif');
  }

  const arrivalAirport = await Airport.findById(arrivalAirportId);
  if (!arrivalAirport) {
    throw new Error('Aéroport d\'arrivée introuvable');
  }
  if (!arrivalAirport.isActive) {
    throw new Error('Aéroport d\'arrivée inactif');
  }

  // Vérifier que les aéroports sont différents
  if (departureAirportId.toString() === arrivalAirportId.toString()) {
    throw new Error('Les aéroports de départ et d\'arrivée doivent être différents');
  }

  // Vérifier que la compagnie existe et est active
  const airline = await Airline.findById(airlineId);
  if (!airline) {
    throw new Error('Compagnie aérienne introuvable');
  }
  if (!airline.isActive) {
    throw new Error('Compagnie aérienne inactive');
  }

  // Vérifier les dates
  const departure = new Date(scheduledDeparture);
  const arrival = new Date(scheduledArrival);
  const now = new Date();

  // L'arrivée doit être après le départ
  const timeDiff = arrival - departure;
  const minDuration = 15 * 60 * 1000; // 15 minutes

  if (timeDiff < minDuration) {
    throw new Error('L\'arrivée doit être au moins 15 minutes après le départ');
  }

  // Vérifier l'unicité du numéro de vol pour ce jour
  const dayStart = new Date(departure);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(departure);
  dayEnd.setHours(23, 59, 59, 999);

  const existingFlight = await Flight.findOne({
    flightNumber,
    scheduledDeparture: {
      $gte: dayStart,
      $lte: dayEnd
    }
  });

  if (existingFlight) {
    throw new Error(`Le numéro de vol ${flightNumber} existe déjà pour cette date`);
  }
};

/**
 * Mettre à jour un vol et synchroniser avec son jumeau
 * @param {ObjectId} flightId - ID du vol à modifier
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Object} - Vol mis à jour
 */
const updateFlightWithLinked = async (flightId, updateData) => {
  const flight = await Flight.findById(flightId);
  
  if (!flight) {
    throw new Error('Vol introuvable');
  }

  // Champs synchronisés avec le vol jumeau
  const syncedFields = [
    'scheduledDeparture',
    'scheduledArrival',
    'actualDeparture',
    'actualArrival',
    'status',
    'delayMinutes',
    'cancellationReason',
    'remarks'
  ];

  // Préparer les mises à jour
  const updates = {};
  const linkedUpdates = {};

  Object.keys(updateData).forEach(key => {
    updates[key] = updateData[key];
    
    // Si le champ doit être synchronisé, préparer la mise à jour du jumeau
    if (syncedFields.includes(key)) {
      linkedUpdates[key] = updateData[key];
    }
  });

  // Mettre à jour le vol principal
  Object.assign(flight, updates);
  await flight.save();

  // Mettre à jour le vol jumeau si nécessaire
  if (Object.keys(linkedUpdates).length > 0 && flight.linkedFlightId) {
    await Flight.findByIdAndUpdate(
      flight.linkedFlightId,
      { $set: linkedUpdates },
      { new: true, runValidators: false }
    );
  }

  // Populer les références
  await flight.populate([
    { path: 'airlineId', select: 'code name logo' },
    { path: 'departureAirportId', select: 'code name city' },
    { path: 'arrivalAirportId', select: 'code name city' }
  ]);

  return flight;
};

/**
 * Changer le statut d'un vol
 * @param {ObjectId} flightId - ID du vol
 * @param {String} newStatus - Nouveau statut
 * @returns {Object} - Vol mis à jour
 */
const changeFlightStatus = async (flightId, newStatus, additionalData = {}) => {
  const flight = await Flight.findById(flightId);
  
  if (!flight) {
    throw new Error('Vol introuvable');
  }

  // Validation des transitions de statut
  validateStatusTransition(flight.status, newStatus);

  // Préparer les mises à jour
  const updates = {
    status: newStatus,
    ...additionalData
  };

  // Si le vol décolle, enregistrer l'heure réelle
  if (newStatus === 'departed' && !flight.actualDeparture) {
    updates.actualDeparture = new Date();
  }

  // Si le vol atterrit, enregistrer l'heure réelle
  if (newStatus === 'landed' && !flight.actualArrival) {
    updates.actualArrival = new Date();
  }

  return await updateFlightWithLinked(flightId, updates);
};

/**
 * Valider les transitions de statut
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'scheduled': ['boarding', 'delayed', 'cancelled'],
    'boarding': ['departed', 'delayed', 'cancelled'],
    'delayed': ['boarding', 'departed', 'cancelled'],
    'departed': ['in_air', 'cancelled'],
    'in_air': ['landed'],
    'landed': [],
    'cancelled': []
  };

  if (!validTransitions[currentStatus]) {
    throw new Error(`Statut actuel invalide: ${currentStatus}`);
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new Error(`Transition de ${currentStatus} vers ${newStatus} non autorisée`);
  }
};

/**
 * Annuler un vol
 * @param {ObjectId} flightId - ID du vol
 * @param {String} reason - Raison de l'annulation
 * @returns {Object} - Vol annulé
 */
const cancelFlight = async (flightId, reason) => {
  return await changeFlightStatus(flightId, 'cancelled', {
    cancellationReason: reason
  });
};

/**
 * Ajouter un retard
 * @param {ObjectId} flightId - ID du vol
 * @param {Number} delayMinutes - Minutes de retard
 * @returns {Object} - Vol mis à jour
 */
const addDelay = async (flightId, delayMinutes) => {
  const flight = await Flight.findById(flightId);
  
  if (!flight) {
    throw new Error('Vol introuvable');
  }

  // Calculer les nouvelles heures
  const newScheduledDeparture = new Date(flight.scheduledDeparture);
  newScheduledDeparture.setMinutes(newScheduledDeparture.getMinutes() + delayMinutes);

  const newScheduledArrival = new Date(flight.scheduledArrival);
  newScheduledArrival.setMinutes(newScheduledArrival.getMinutes() + delayMinutes);

  return await updateFlightWithLinked(flightId, {
    status: 'delayed',
    delayMinutes: flight.delayMinutes + delayMinutes,
    scheduledDeparture: newScheduledDeparture,
    scheduledArrival: newScheduledArrival
  });
};

/**
 * Supprimer un vol et son jumeau
 * @param {ObjectId} flightId - ID du vol à supprimer
 */
const deleteFlightWithLinked = async (flightId) => {
  const flight = await Flight.findById(flightId);
  
  if (!flight) {
    throw new Error('Vol introuvable');
  }

  // Vérifier que le vol n'est pas déjà parti
  if (['departed', 'in_air', 'landed'].includes(flight.status)) {
    throw new Error('Impossible de supprimer un vol déjà en cours ou terminé');
  }

  // Supprimer les deux vols
  await Flight.findByIdAndDelete(flightId);
  if (flight.linkedFlightId) {
    await Flight.findByIdAndDelete(flight.linkedFlightId);
  }

  return { success: true };
};

module.exports = {
  createFlightWithLinked,
  updateFlightWithLinked,
  changeFlightStatus,
  cancelFlight,
  addDelay,
  deleteFlightWithLinked,
  validateFlightCreation
};