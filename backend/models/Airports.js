const mongoose = require('mongoose');

/**
 * Schema pour les aéroports
 * Définit la structure d'un document "airport" dans MongoDB
 */
const airportSchema = new mongoose.Schema(
  {
    // Code IATA (3 lettres) - Identifiant unique international
    code: {
      type: String,
      required: [true, 'Le code IATA est obligatoire'],
      unique: true,           // Pas de doublons
      uppercase: true,        // Toujours en majuscules
      trim: true,            // Enlève les espaces
      minlength: [3, 'Le code IATA doit faire 3 caractères'],
      maxlength: [3, 'Le code IATA doit faire 3 caractères'],
      match: [/^[A-Z]{3}$/, 'Le code IATA doit contenir uniquement des lettres']
    },

    // Nom de l'aéroport
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères']
    },

    // Ville
    city: {
      type: String,
      required: [true, 'La ville est obligatoire'],
      trim: true
    },

    // Région de Madagascar
    region: {
      type: String,
      required: [true, 'La région est obligatoire'],
      trim: true
    },

    // Aéroport actif ou non
    isActive: {
      type: Boolean,
      default: true
    },

    // Marqueur pour l'aéroport central (Antananarivo)
    isCentral: {
      type: Boolean,
      default: false
    }
  },
  {
    // Options du schema
    timestamps: true  // Ajoute automatiquement createdAt et updatedAt
  }
);

/**
 * Index pour améliorer les performances de recherche
 * Quand on recherche par code, MongoDB ira plus vite
 */
airportSchema.index({ code: 1 });
airportSchema.index({ isActive: 1 });

/**
 * Méthode statique pour vérifier qu'il n'y a qu'un seul aéroport central
 */
airportSchema.pre('save', async function(next) {
  // Si on essaie de mettre isCentral à true
  if (this.isCentral) {
    // Vérifier s'il existe déjà un aéroport central
    const existingCentral = await this.constructor.findOne({
      isCentral: true,
      _id: { $ne: this._id }  // Exclure le document actuel
    });

    if (existingCentral) {
      throw new Error('Un aéroport central existe déjà (Antananarivo)');
    }
  }
  next();
});

module.exports = mongoose.model('Airport', airportSchema);