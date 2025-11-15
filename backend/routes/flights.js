const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getFlights,
  getFlightById,
  createFlight,
  updateFlight,
  changeStatus,
  cancelFlight,
  addDelay,
  deleteFlight
} = require('../controllers/flightController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

/**
 * Toutes les routes nécessitent une authentification
 */
router.use(protect);

/**
 * Validateurs pour la création de vol
 */
const createFlightValidators = [
  body('flightNumber')
    .notEmpty().withMessage('Le numéro de vol est obligatoire')
    .matches(/^[A-Z0-9]{2,3}\d{1,4}$/i).withMessage('Format de numéro de vol invalide (ex: MD301)'),
  body('airlineId')
    .notEmpty().withMessage('La compagnie est obligatoire')
    .isMongoId().withMessage('ID compagnie invalide'),
  body('departureAirportId')
    .notEmpty().withMessage('L\'aéroport de départ est obligatoire')
    .isMongoId().withMessage('ID aéroport de départ invalide'),
  body('arrivalAirportId')
    .notEmpty().withMessage('L\'aéroport d\'arrivée est obligatoire')
    .isMongoId().withMessage('ID aéroport d\'arrivée invalide'),
  body('scheduledDeparture')
    .notEmpty().withMessage('L\'heure de départ est obligatoire')
    .isISO8601().withMessage('Format de date invalide'),
  body('scheduledArrival')
    .notEmpty().withMessage('L\'heure d\'arrivée est obligatoire')
    .isISO8601().withMessage('Format de date invalide'),
  body('aircraftType')
    .optional()
    .isString().withMessage('Le type d\'avion doit être une chaîne'),
  body('remarks')
    .optional()
    .isString().withMessage('Les remarques doivent être une chaîne')
];

/**
 * Validateurs pour la modification de vol
 */
const updateFlightValidators = [
  param('id').isMongoId().withMessage('ID invalide'),
  body('scheduledDeparture')
    .optional()
    .isISO8601().withMessage('Format de date invalide'),
  body('scheduledArrival')
    .optional()
    .isISO8601().withMessage('Format de date invalide'),
  body('aircraftType')
    .optional()
    .isString(),
  body('remarks')
    .optional()
    .isString()
];

/**
 * Validateurs pour changement de statut
 */
const changeStatusValidators = [
  param('id').isMongoId().withMessage('ID invalide'),
  body('status')
    .notEmpty().withMessage('Le statut est obligatoire')
    .isIn(['scheduled', 'boarding', 'departed', 'in_air', 'landed', 'delayed', 'cancelled'])
    .withMessage('Statut invalide')
];

/**
 * Validateurs pour annulation
 */
const cancelFlightValidators = [
  param('id').isMongoId().withMessage('ID invalide'),
  body('reason')
    .notEmpty().withMessage('La raison d\'annulation est obligatoire')
    .isLength({ min: 5 }).withMessage('La raison doit contenir au moins 5 caractères')
];

/**
 * Validateurs pour retard
 */
const addDelayValidators = [
  param('id').isMongoId().withMessage('ID invalide'),
  body('delayMinutes')
    .notEmpty().withMessage('Le retard est obligatoire')
    .isInt({ min: 1, max: 1440 }).withMessage('Le retard doit être entre 1 et 1440 minutes (24h)')
];

/**
 * Routes accessibles par SuperAdmin et Admin Regional
 */

// GET /api/flights - Lister les vols avec filtres
router.get(
  '/',
  restrictTo('superadmin', 'admin_regional'),
  getFlights
);

// GET /api/flights/:id - Récupérer un vol
router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID invalide'),
  validate,
  restrictTo('superadmin', 'admin_regional'),
  getFlightById
);

// POST /api/flights - Créer un vol
router.post(
  '/',
  createFlightValidators,
  validate,
  restrictTo('superadmin', 'admin_regional'),
  createFlight
);

// PATCH /api/flights/:id - Modifier un vol
router.patch(
  '/:id',
  updateFlightValidators,
  validate,
  restrictTo('superadmin', 'admin_regional'),
  updateFlight
);

// PATCH /api/flights/:id/status - Changer le statut
router.patch(
  '/:id/status',
  changeStatusValidators,
  validate,
  restrictTo('superadmin', 'admin_regional'),
  changeStatus
);

// POST /api/flights/:id/cancel - Annuler un vol
router.post(
  '/:id/cancel',
  cancelFlightValidators,
  validate,
  restrictTo('superadmin', 'admin_regional'),
  cancelFlight
);

// POST /api/flights/:id/delay - Ajouter un retard
router.post(
  '/:id/delay',
  addDelayValidators,
  validate,
  restrictTo('superadmin', 'admin_regional'),
  addDelay
);

// DELETE /api/flights/:id - Supprimer un vol (SuperAdmin uniquement)
router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID invalide'),
  validate,
  restrictTo('superadmin'),
  deleteFlight
);

module.exports = router;