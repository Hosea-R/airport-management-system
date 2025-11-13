const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Email unique
    email: {
      type: String,
      required: [true, 'L\'email est obligatoire'],
      unique: true,
      lowercase: true,  // Convertir en minuscules
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Email invalide'
      ]
    },

    // Mot de passe (sera hashé)
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false  // Ne pas retourner le password par défaut dans les requêtes
    },

    // Prénom
    firstName: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true
    },

    // Nom
    lastName: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true
    },

    // Rôle : superadmin ou admin_regional
    role: {
      type: String,
      enum: {
        values: ['superadmin', 'admin_regional'],
        message: 'Le rôle doit être "superadmin" ou "admin_regional"'
      },
      required: true
    },

    // Aéroport assigné (null pour superadmin)
    airportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',  // Référence vers la collection Airport
      default: null,
      required: function() {
        // Obligatoire seulement si admin_regional
        return this.role === 'admin_regional';
      }
    },

    // Compte actif
    isActive: {
      type: Boolean,
      default: true
    },

    // Dernière connexion
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

/**
 * Middleware PRE-SAVE : Hash le mot de passe avant sauvegarde
 * S'exécute automatiquement avant chaque .save()
 */
userSchema.pre('save', async function(next) {
  // Si le password n'a pas été modifié, passer
  if (!this.isModified('password')) {
    return next();
  }

  // Générer un "salt" (grain de sel pour renforcer le hash)
  const salt = await bcrypt.genSalt(10);
  
  // Hasher le password
  this.password = await bcrypt.hash(this.password, salt);
  
  next();
});

/**
 * Méthode d'instance pour comparer les mots de passe
 * @param {String} enteredPassword - Mot de passe saisi par l'utilisateur
 * @returns {Boolean} true si les passwords correspondent
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Index
userSchema.index({ email: 1 });
userSchema.index({ airportId: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);