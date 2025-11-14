const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    // Type d'action
    action: {
      type: String,
      required: true,
      enum: [
        'user_login',
        'user_logout',
        'user_created',
        'user_updated',
        'user_deleted',
        'flight_created',
        'flight_updated',
        'flight_deleted',
        'flight_status_changed',
        'airport_created',
        'airport_updated',
        'airport_deleted',
        'airline_created',
        'airline_updated',
        'airline_deleted',          // ✅ AJOUTÉ
        'advertisement_created',
        'advertisement_updated',
        'advertisement_deleted',    // ✅ AJOUTÉ
        'scrolling_text_created',
        'scrolling_text_updated',
        'scrolling_text_deleted'    // ✅ AJOUTÉ
      ]
    },

    // Utilisateur qui a fait l'action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Aéroport concerné (si applicable)
    airportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      default: null
    },

    // Vol concerné (si applicable)
    flightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      default: null
    },

    // Détails supplémentaires (JSON)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Adresse IP
    ipAddress: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false }
  }
);

// Index pour rechercher les logs rapidement
logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ action: 1, timestamp: -1 });
logSchema.index({ flightId: 1 });

module.exports = mongoose.model('Log', logSchema);