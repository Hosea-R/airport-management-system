const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware pour protéger les routes (vérifier JWT)
 * Vérifie que l'utilisateur est connecté
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Récupérer le token depuis le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Format: "Bearer TOKEN_ICI"
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier que le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis la DB (sans le password)
    req.user = await User.findById(decoded.userId).select('-password').populate('airportId');

    // Vérifier que l'utilisateur existe toujours
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que le compte est actif
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    next();  // Passer au middleware suivant ou au controller
    
  } catch (error) {
    console.error('Erreur d\'authentification:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide ou expiré'
    });
  }
};

/**
 * Middleware pour restreindre l'accès selon le rôle
 * @param  {...string} roles - Rôles autorisés
 * 
 * Utilisation: restrictTo('superadmin')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user a été ajouté par le middleware 'protect'
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission d\'effectuer cette action'
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };