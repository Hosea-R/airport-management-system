const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema(
  {
    // Code IATA compagnie (2 lettres)
    code: {
      type: String,
      required: [true, 'Le code IATA est obligatoire'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, 'Le code IATA doit faire 2 caractères'],
      maxlength: [2, 'Le code IATA doit faire 2 caractères'],
      match: [/^[A-Z0-9]{2}$/, 'Le code IATA doit contenir 2 lettres ou chiffres']
    },

    // Nom de la compagnie
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true
    },

    // Logo (URL Imgur - optionnel)
    logo: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          // Si un logo est fourni, vérifier que c'est une URL valide
          if (!v) return true;  // Null/undefined = OK
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Le logo doit être une URL valide'
      }
    },

    // Compagnie active
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index
airlineSchema.index({ code: 1 });
airlineSchema.index({ isActive: 1 });

module.exports = mongoose.model('Airline', airlineSchema);