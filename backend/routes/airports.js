const express = require('express');
const { body, param } = require('express-validator');
const {
  getAirports,
  getAirportById,
  createAirport,
  updateAirport,
  deleteAirport
} = require('../controllers/airportController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

/**
 * Toutes les routes sont protégées et réservées au SuperAdmin
 */
router.use(protect);
router.use(restrictTo('superadmin'));

/**
 * Validateurs pour la création d'aéroport
 */
const createAirportValidators = [
  body('code')
    .notEmpty().withMessage('Le code IATA est obligatoire')
    .isLength({ min: 3, max: 3 }).withMessage('Le code IATA doit faire 3 caractères')
    .matches(/^[A-Z]{3}$/i).withMessage('Le code IATA doit contenir uniquement des lettres'),
  body('name')
    .notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('city')
    .notEmpty().withMessage('La ville est obligatoire'),
  body('region')
    .notEmpty().withMessage('La région est obligatoire'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('isCentral')
    .optional()
    .isBoolean().withMessage('isCentral doit être un booléen')
];

/**
 * Validateurs pour la modification d'aéroport
 */
const updateAirportValidators = [
  param('id')
    .isMongoId().withMessage('ID invalide'),
  body('code')
    .optional()
    .isLength({ min: 3, max: 3 }).withMessage('Le code IATA doit faire 3 caractères')
    .matches(/^[A-Z]{3}$/i).withMessage('Le code IATA doit contenir uniquement des lettres'),
  body('name')
    .optional()
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('city')
    .optional()
    .notEmpty().withMessage('La ville ne peut pas être vide'),
  body('region')
    .optional()
    .notEmpty().withMessage('La région ne peut pas être vide'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen'),
  body('isCentral')
    .optional()
    .isBoolean().withMessage('isCentral doit être un booléen')
];

/**
 * Routes
 */
router.get('/', getAirports);
router.get('/:id', param('id').isMongoId().withMessage('ID invalide'), validate, getAirportById);
router.post('/', createAirportValidators, validate, createAirport);
router.patch('/:id', updateAirportValidators, validate, updateAirport);
router.delete('/:id', param('id').isMongoId().withMessage('ID invalide'), validate, deleteAirport);

module.exports = router;