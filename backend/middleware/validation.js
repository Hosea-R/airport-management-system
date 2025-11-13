const { validationResult } = require('express-validator');

/**
 * Middleware pour vérifier les résultats de validation
 * Utilisé après les validateurs de express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Formater les erreurs de façon lisible
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: formattedErrors
    });
  }
  
  next();
};

module.exports = validate;