const Flight = require('../models/Flight');
const Log = require('../models/Log');
const flightService = require('../services/flightService');

/**
 * @route   GET /api/flights
 * @desc    Récupérer les vols avec filtres
 * @access  Private (SuperAdmin & Admin Regional)
 */
const getFlights = async (req, res, next) => {
  try {
    const {
      airportId,
      flightType,
      status,
      date,
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Construire le filtre
    let filter = { isArchived: false };

    // Filtrer par aéroport (départ OU arrivée)
    if (airportId) {
      filter.$or = [
        { departureAirportId: airportId },
        { arrivalAirportId: airportId }
      ];
    }

    // Filtrer par type de vol (departure/arrival)
    if (flightType) {
      filter.flightType = flightType;
    }

    // Filtrer par statut
    if (status) {
      filter.status = status;
    }

    // Filtrer par date
    if (date) {
      const searchDate = new Date(date);
      const dayStart = new Date(searchDate.setHours(0, 0, 0, 0));
      const dayEnd = new Date(searchDate.setHours(23, 59, 59, 999));
      
      filter.scheduledDeparture = {
        $gte: dayStart,
        $lte: dayEnd
      };
    }

    // Recherche par numéro de vol
    if (search) {
      filter.flightNumber = { $regex: search, $options: 'i' };
    }

    // Si admin régional, filtrer par son aéroport
    if (req.user.role === 'admin_regional') {
      filter.$or = [
        { departureAirportId: req.user.airportId },
        { arrivalAirportId: req.user.airportId }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const flights = await Flight.find(filter)
      .populate('airlineId', 'code name logo')
      .populate('departureAirportId', 'code name city')
      .populate('arrivalAirportId', 'code name city')
      .sort({ scheduledDeparture: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Flight.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: flights.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: flights
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/flights/:id
 * @desc    Récupérer un vol par ID
 * @access  Private
 */
const getFlightById = async (req, res, next) => {
  try {
    const flight = await Flight.findById(req.params.id)
      .populate('airlineId', 'code name logo')
      .populate('departureAirportId', 'code name city region')
      .populate('arrivalAirportId', 'code name city region')
      .populate('createdBy', 'firstName lastName email');

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol introuvable'
      });
    }

    // Si admin régional, vérifier qu'il a accès
    if (req.user.role === 'admin_regional') {
      const hasAccess = 
        flight.departureAirportId._id.toString() === req.user.airportId.toString() ||
        flight.arrivalAirportId._id.toString() === req.user.airportId.toString();

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé à ce vol'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: flight
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/flights
 * @desc    Créer un nouveau vol
 * @access  Private (SuperAdmin & Admin Regional)
 */
const createFlight = async (req, res, next) => {
  try {
    const {
      flightNumber,
      airlineId,
      aircraftType,
      departureAirportId,
      arrivalAirportId,
      scheduledDeparture,
      scheduledArrival,
      remarks
    } = req.body;

    // Si admin régional, vérifier que c'est un départ de son aéroport
    if (req.user.role === 'admin_regional') {
      if (departureAirportId !== req.user.airportId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez créer que des départs depuis votre aéroport'
        });
      }
    }

    // Créer les vols (départ + arrivée)
    const { departureFlight, arrivalFlight } = await flightService.createFlightWithLinked(
      {
        flightNumber,
        airlineId,
        aircraftType,
        departureAirportId,
        arrivalAirportId,
        scheduledDeparture,
        scheduledArrival,
        remarks
      },
      req.user._id,
      req.user.airportId || departureAirportId
    );

    // Logger l'action
    await Log.create({
      action: 'flight_created',
      userId: req.user._id,
      airportId: req.user.airportId,
      flightId: departureFlight._id,
      details: {
        flightNumber,
        departureAirport: departureFlight.departureAirportId.code,
        arrivalAirport: departureFlight.arrivalAirportId.code,
        linkedFlightId: arrivalFlight._id
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Vol créé avec succès',
      data: {
        departureFlight,
        arrivalFlight
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/flights/:id
 * @desc    Modifier un vol
 * @access  Private (SuperAdmin & Admin Regional)
 */
const updateFlight = async (req, res, next) => {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol introuvable'
      });
    }

    // Si admin régional, vérifier l'accès
    if (req.user.role === 'admin_regional') {
      const hasAccess = 
        flight.departureAirportId.toString() === req.user.airportId.toString() ||
        flight.arrivalAirportId.toString() === req.user.airportId.toString();

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé à ce vol'
        });
      }
    }

    // Empêcher la modification de certains champs
    const allowedFields = [
      'scheduledDeparture',
      'scheduledArrival',
      'aircraftType',
      'remarks'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Mettre à jour avec synchronisation
    const updatedFlight = await flightService.updateFlightWithLinked(
      req.params.id,
      updates
    );

    // Logger l'action
    await Log.create({
      action: 'flight_updated',
      userId: req.user._id,
      airportId: req.user.airportId,
      flightId: updatedFlight._id,
      details: {
        flightNumber: updatedFlight.flightNumber,
        changes: updates
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Vol modifié avec succès',
      data: updatedFlight
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/flights/:id/status
 * @desc    Changer le statut d'un vol
 * @access  Private
 */
const changeStatus = async (req, res, next) => {
  try {
    const { status, additionalData } = req.body;

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol introuvable'
      });
    }

    // Si admin régional, vérifier l'accès
    if (req.user.role === 'admin_regional') {
      const hasAccess = 
        flight.departureAirportId.toString() === req.user.airportId.toString() ||
        flight.arrivalAirportId.toString() === req.user.airportId.toString();

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé à ce vol'
        });
      }
    }

    const updatedFlight = await flightService.changeFlightStatus(
      req.params.id,
      status,
      additionalData || {}
    );

    // Logger l'action
    await Log.create({
      action: 'flight_status_changed',
      userId: req.user._id,
      airportId: req.user.airportId,
      flightId: updatedFlight._id,
      details: {
        flightNumber: updatedFlight.flightNumber,
        oldStatus: flight.status,
        newStatus: status
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Statut modifié avec succès',
      data: updatedFlight
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/flights/:id/cancel
 * @desc    Annuler un vol
 * @access  Private
 */
const cancelFlight = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'La raison d\'annulation est obligatoire'
      });
    }

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol introuvable'
      });
    }

    const cancelledFlight = await flightService.cancelFlight(
      req.params.id,
      reason
    );

    // Logger l'action
    await Log.create({
      action: 'flight_status_changed',
      userId: req.user._id,
      airportId: req.user.airportId,
      flightId: cancelledFlight._id,
      details: {
        flightNumber: cancelledFlight.flightNumber,
        action: 'cancelled',
        reason
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Vol annulé avec succès',
      data: cancelledFlight
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/flights/:id/delay
 * @desc    Ajouter un retard
 * @access  Private
 */
const addDelay = async (req, res, next) => {
  try {
    const { delayMinutes } = req.body;

    if (!delayMinutes || delayMinutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le retard doit être supérieur à 0'
      });
    }

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol introuvable'
      });
    }

    const delayedFlight = await flightService.addDelay(
      req.params.id,
      parseInt(delayMinutes)
    );

    // Logger l'action
    await Log.create({
      action: 'flight_updated',
      userId: req.user._id,
      airportId: req.user.airportId,
      flightId: delayedFlight._id,
      details: {
        flightNumber: delayedFlight.flightNumber,
        action: 'delay_added',
        delayMinutes
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Retard ajouté avec succès',
      data: delayedFlight
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/flights/:id
 * @desc    Supprimer un vol
 * @access  Private (SuperAdmin uniquement)
 */
const deleteFlight = async (req, res, next) => {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol introuvable'
      });
    }

    // Logger avant suppression
    await Log.create({
      action: 'flight_deleted',
      userId: req.user._id,
      airportId: req.user.airportId,
      flightId: flight._id,
      details: {
        flightNumber: flight.flightNumber,
        departureAirport: flight.departureAirportId,
        arrivalAirport: flight.arrivalAirportId
      },
      ipAddress: req.ip
    });

    await flightService.deleteFlightWithLinked(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Vol supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFlights,
  getFlightById,
  createFlight,
  updateFlight,
  changeStatus,
  cancelFlight,
  addDelay,
  deleteFlight
};