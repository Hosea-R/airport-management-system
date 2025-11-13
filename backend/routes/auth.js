const express = require('express');
const { body } = require('express-validator');
const { login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

/**
 * Validateurs pour le login
 */
const loginValidators = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// Routes publiques
router.post('/login', loginValidators, validate, login);

// Routes protégées (nécessitent d'être connecté)
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;