const User = require('../models/User');
const Log = require('../models/Log');
const { generateToken } = require('../config/jwt');

/**
 * @route   POST /api/auth/login
 * @desc    Connecter un utilisateur
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Vérifier que email et password sont fournis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur (avec le password car select: false)
    const user = await User.findOne({ email })
      .select('+password')
      .populate('airportId');

    // Vérifier que l'utilisateur existe
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier que le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Générer le token JWT
    const token = generateToken({
      userId: user._id,
      role: user.role
    });

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Logger l'action
    await Log.create({
      action: 'user_login',
      userId: user._id,
      airportId: user.airportId?._id || null,
      ipAddress: req.ip,
      details: {
        userAgent: req.headers['user-agent']
      }
    });

    // Retourner la réponse
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          airport: user.airportId ? {
            id: user.airportId._id,
            code: user.airportId.code,
            name: user.airportId.name,
            city: user.airportId.city
          } : null
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnecter un utilisateur
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    // Logger l'action
    await Log.create({
      action: 'user_logout',
      userId: req.user._id,
      airportId: req.user.airportId?._id || null,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Récupérer l'utilisateur connecté
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user a été ajouté par le middleware 'protect'
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          airport: req.user.airportId ? {
            id: req.user.airportId._id,
            code: req.user.airportId.code,
            name: req.user.airportId.name,
            city: req.user.airportId.city
          } : null,
          lastLogin: req.user.lastLogin
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe
};