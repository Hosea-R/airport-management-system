const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema(
  {
    // Numéro de vol (ex: MD301)
    flightNumber: {
      type: String,
      required: [true, 'Le numéro de vol est obligatoire'],
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{2,3}\d{1,4}$/, 'Format de numéro de vol invalide']
    },

    // Compagnie aérienne
    airlineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airline',
      required: [true, 'La compagnie est obligatoire']
    },

    // Type d'avion (optionnel)
    aircraftType: {
      type: String,
      default: null,
      trim: true
    },

    // ========== DÉPART ==========
    
    departureAirportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: [true, 'L\'aéroport de départ est obligatoire']
    },

    scheduledDeparture: {
      type: Date,
      required: [true, 'L\'heure de départ prévue est obligatoire']
    },

    actualDeparture: {
      type: Date,
      default: null
    },

    // ========== ARRIVÉE ==========
    
    arrivalAirportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: [true, 'L\'aéroport d\'arrivée est obligatoire']
    },

    scheduledArrival: {
      type: Date,
      required: [true, 'L\'heure d\'arrivée prévue est obligatoire']
    },

    actualArrival: {
      type: Date,
      default: null
    },

    // ========== STATUT ==========
    
    status: {
      type: String,
      enum: [
        'scheduled',   // Prévu
        'boarding',    // Embarquement
        'departed',    // Décollé
        'in_air',      // En vol
        'landed',      // Atterri
        'delayed',     // Retardé
        'cancelled'    // Annulé
      ],
      default: 'scheduled'
    },

    // ========== TYPE DE VOL ==========
    
    // Vue depuis quel aéroport ? (départ ou arrivée)
    flightType: {
      type: String,
      enum: ['departure', 'arrival'],
      required: true
    },

    // ========== LIAISON BIDIRECTIONNELLE ==========
    
    // ID du vol jumeau (le même vol vu depuis l'autre aéroport)
    linkedFlightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      default: null
    },

    // ========== RETARD / ANNULATION ==========
    
    delayMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Le retard ne peut pas être négatif']
    },

    cancellationReason: {
      type: String,
      default: null
    },

    // ========== REMARQUES ==========
    
    remarks: {
      type: String,
      default: null
    },

    // ========== TRAÇABILITÉ ==========
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    createdAirportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: true
    },

    // ========== ARCHIVAGE ==========
    
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

/**
 * Index composés pour optimiser les requêtes fréquentes
 */
flightSchema.index({ departureAirportId: 1, scheduledDeparture: 1 });
flightSchema.index({ arrivalAirportId: 1, scheduledArrival: 1 });
flightSchema.index({ flightNumber: 1, scheduledDeparture: 1 });
flightSchema.index({ status: 1 });
flightSchema.index({ isArchived: 1 });
flightSchema.index({ linkedFlightId: 1 });

/**
 * Validation : Les aéroports de départ et d'arrivée doivent être différents
 */
flightSchema.pre('save', function(next) {
  if (this.departureAirportId.equals(this.arrivalAirportId)) {
    return next(new Error('Les aéroports de départ et d\'arrivée doivent être différents'));
  }
  next();
});

/**
 * Validation : L'heure d'arrivée doit être après l'heure de départ
 */
flightSchema.pre('save', function(next) {
  const timeDiff = this.scheduledArrival - this.scheduledDeparture;
  const minDuration = 15 * 60 * 1000; // 15 minutes en millisecondes

  if (timeDiff < minDuration) {
    return next(new Error('L\'arrivée doit être au moins 15 minutes après le départ'));
  }
  next();
});

module.exports = mongoose.model('Flight', flightSchema);