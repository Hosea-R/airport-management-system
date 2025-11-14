const Airline = require('../models/Airline');
const Log = require('../models/Log');

/**
 * @route   GET /api/airlines
 * @desc    Récupérer toutes les compagnies
 * @access  Private (SuperAdmin)
 */
const getAirlines = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;

    let filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const airlines = await Airline.find(filter).sort({ code: 1 });

    res.status(200).json({
      success: true,
      count: airlines.length,
      data: airlines
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/airlines/:id
 * @desc    Récupérer une compagnie par ID
 * @access  Private (SuperAdmin)
 */
const getAirlineById = async (req, res, next) => {
  try {
    const airline = await Airline.findById(req.params.id);

    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'Compagnie non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: airline
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/airlines
 * @desc    Créer une nouvelle compagnie
 * @access  Private (SuperAdmin)
 */
const createAirline = async (req, res, next) => {
  try {
    const { code, name, logo, isActive } = req.body;

    // Vérifier si le code existe déjà
    const existingAirline = await Airline.findOne({ code: code.toUpperCase() });
    if (existingAirline) {
      return res.status(400).json({
        success: false,
        message: `Le code compagnie ${code.toUpperCase()} existe déjà`
      });
    }

    // Créer la compagnie
    const airline = await Airline.create({
      code: code.toUpperCase(),
      name,
      logo: logo || null,
      isActive: isActive !== undefined ? isActive : true
    });

    // Logger l'action
    await Log.create({
      action: 'airline_created',
      userId: req.user._id,
      details: {
        airlineCode: airline.code,
        airlineName: airline.name
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Compagnie créée avec succès',
      data: airline
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/airlines/:id
 * @desc    Modifier une compagnie
 * @access  Private (SuperAdmin)
 */
const updateAirline = async (req, res, next) => {
  try {
    const { code, name, logo, isActive } = req.body;

    let airline = await Airline.findById(req.params.id);

    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'Compagnie non trouvée'
      });
    }

    // Si on change le code, vérifier qu'il n'existe pas déjà
    if (code && code.toUpperCase() !== airline.code) {
      const existingAirline = await Airline.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });

      if (existingAirline) {
        return res.status(400).json({
          success: false,
          message: `Le code compagnie ${code.toUpperCase()} existe déjà`
        });
      }
    }

    // Mettre à jour les champs
    if (code) airline.code = code.toUpperCase();
    if (name) airline.name = name;
    if (logo !== undefined) airline.logo = logo;
    if (isActive !== undefined) airline.isActive = isActive;

    await airline.save();

    // Logger l'action
    await Log.create({
      action: 'airline_updated',
      userId: req.user._id,
      details: {
        airlineId: airline._id,
        airlineCode: airline.code,
        changes: req.body
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Compagnie modifiée avec succès',
      data: airline
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/airlines/:id
 * @desc    Supprimer une compagnie
 * @access  Private (SuperAdmin)
 */
const deleteAirline = async (req, res, next) => {
  try {
    const airline = await Airline.findById(req.params.id);

    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'Compagnie non trouvée'
      });
    }

    // Logger avant suppression
    await Log.create({
      action: 'airline_deleted',
      userId: req.user._id,
      details: {
        airlineCode: airline.code,
        airlineName: airline.name
      },
      ipAddress: req.ip
    });

    await airline.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Compagnie supprimée avec succès'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAirlines,
  getAirlineById,
  createAirline,
  updateAirline,
  deleteAirline
};