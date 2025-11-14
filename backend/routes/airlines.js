const express = require('express');
const { body, param } = require('express-validator');
const {
  getAirlines,
  getAirlineById,
  createAirline,
  updateAirline,
  deleteAirline
} = require('../controllers/airlineController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

/**
 * Toutes les routes sont protégées et réservées au SuperAdmin
 */
router.use(protect);
router.use(restrictTo('superadmin'));

/**
 * Validateurs pour la création de compagnie
 */
const createAirlineValidators = [
  body('code')
    .notEmpty().withMessage('Le code IATA est obligatoire')
    .isLength({ min: 2, max: 2 }).withMessage('Le code IATA doit faire 2 caractères')
    .matches(/^[A-Z0-9]{2}$/i).withMessage('Le code IATA doit contenir 2 lettres ou chiffres'),
  body('name')
    .notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('logo')
    .optional()
    .isURL().withMessage('Le logo doit être une URL valide'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen')
];

/**
 * Validateurs pour la modification de compagnie
 */
const updateAirlineValidators = [
  param('id')
    .isMongoId().withMessage('ID invalide'),
  body('code')
    .optional()
    .isLength({ min: 2, max: 2 }).withMessage('Le code IATA doit faire 2 caractères')
    .matches(/^[A-Z0-9]{2}$/i).withMessage('Le code IATA doit contenir 2 lettres ou chiffres'),
  body('name')
    .optional()
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('logo')
    .optional()
    .custom((value) => {
      if (value === null || value === '') return true;
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(value)) {
        throw new Error('Le logo doit être une URL valide');
      }
      return true;
    }),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive doit être un booléen')
];

/**
 * Routes
 */
router.get('/', getAirlines);
router.get('/:id', param('id').isMongoId().withMessage('ID invalide'), validate, getAirlineById);
router.post('/', createAirlineValidators, validate, createAirline);
router.patch('/:id', updateAirlineValidators, validate, updateAirline);
router.delete('/:id', param('id').isMongoId().withMessage('ID invalide'), validate, deleteAirline);

module.exports = router;