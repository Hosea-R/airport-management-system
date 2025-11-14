const Airport = require('../models/Airport');
const Log = require('../models/Log');

/**
 * @route   GET /api/airports
 * @desc    Récupérer tous les aéroports
 * @access  Private (SuperAdmin)
 */
const getAirports = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;

    // Construire le filtre
    let filter = {};

    // Filtrer par statut actif/inactif
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Recherche par code, nom ou ville
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const airports = await Airport.find(filter).sort({ code: 1 });

    res.status(200).json({
      success: true,
      count: airports.length,
      data: airports
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/airports/:id
 * @desc    Récupérer un aéroport par ID
 * @access  Private (SuperAdmin)
 */
const getAirportById = async (req, res, next) => {
  try {
    const airport = await Airport.findById(req.params.id);

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Aéroport non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: airport
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/airports
 * @desc    Créer un nouvel aéroport
 * @access  Private (SuperAdmin)
 */
const createAirport = async (req, res, next) => {
  try {
    const { code, name, city, region, isActive, isCentral } = req.body;

    // Vérifier si le code existe déjà
    const existingAirport = await Airport.findOne({ code: code.toUpperCase() });
    if (existingAirport) {
      return res.status(400).json({
        success: false,
        message: `Le code aéroport ${code.toUpperCase()} existe déjà`
      });
    }

    // Créer l'aéroport
    const airport = await Airport.create({
      code: code.toUpperCase(),
      name,
      city,
      region,
      isActive: isActive !== undefined ? isActive : true,
      isCentral: isCentral || false
    });

    // Logger l'action
    await Log.create({
      action: 'airport_created',
      userId: req.user._id,
      details: {
        airportCode: airport.code,
        airportName: airport.name
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Aéroport créé avec succès',
      data: airport
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/airports/:id
 * @desc    Modifier un aéroport
 * @access  Private (SuperAdmin)
 */
const updateAirport = async (req, res, next) => {
  try {
    const { code, name, city, region, isActive, isCentral } = req.body;

    // Trouver l'aéroport
    let airport = await Airport.findById(req.params.id);

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Aéroport non trouvé'
      });
    }

    // Si on change le code, vérifier qu'il n'existe pas déjà
    if (code && code.toUpperCase() !== airport.code) {
      const existingAirport = await Airport.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });

      if (existingAirport) {
        return res.status(400).json({
          success: false,
          message: `Le code aéroport ${code.toUpperCase()} existe déjà`
        });
      }
    }

    // Mettre à jour les champs
    if (code) airport.code = code.toUpperCase();
    if (name) airport.name = name;
    if (city) airport.city = city;
    if (region) airport.region = region;
    if (isActive !== undefined) airport.isActive = isActive;
    if (isCentral !== undefined) airport.isCentral = isCentral;

    await airport.save();

    // Logger l'action
    await Log.create({
      action: 'airport_updated',
      userId: req.user._id,
      details: {
        airportId: airport._id,
        airportCode: airport.code,
        changes: req.body
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Aéroport modifié avec succès',
      data: airport
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/airports/:id
 * @desc    Supprimer un aéroport
 * @access  Private (SuperAdmin)
 */
const deleteAirport = async (req, res, next) => {
  try {
    const airport = await Airport.findById(req.params.id);

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Aéroport non trouvé'
      });
    }

    // Vérifier si l'aéroport est utilisé par des vols (Phase 3)
    // Pour l'instant, on permet la suppression

    // Logger avant suppression
    await Log.create({
      action: 'airport_deleted',
      userId: req.user._id,
      details: {
        airportCode: airport.code,
        airportName: airport.name
      },
      ipAddress: req.ip
    });

    await airport.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Aéroport supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAirports,
  getAirportById,
  createAirport,
  updateAirport,
  deleteAirport
};