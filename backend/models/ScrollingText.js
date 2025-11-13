const mongoose = require('mongoose');

const scrollingTextSchema = new mongoose.Schema(
  {
    // Texte à afficher
    text: {
      type: String,
      required: [true, 'Le texte est obligatoire'],
      trim: true,
      maxlength: [500, 'Le texte ne peut pas dépasser 500 caractères']
    },

    // ========== STYLE ==========
    
    backgroundColor: {
      type: String,
      default: '#1e40af',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide']
    },

    textColor: {
      type: String,
      default: '#ffffff',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide']
    },

    fontSize: {
      type: Number,
      default: 24,
      min: [12, 'Taille minimale : 12px'],
      max: [72, 'Taille maximale : 72px']
    },

    speed: {
      type: Number,  // Pixels par seconde
      default: 50,
      min: [10, 'Vitesse minimale : 10 px/s'],
      max: [200, 'Vitesse maximale : 200 px/s']
    },

    // ========== CIBLAGE ==========
    
    targetAirports: [{
      type: String,
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'Code aéroport invalide']
    }],

    displayOn: [{
      type: String,
      enum: ['arrivals', 'departures', 'general']
    }],

    // ========== PROGRAMMATION ==========
    
    schedulingType: {
      type: String,
      enum: ['manual', 'scheduled', 'always'],
      default: 'always'
    },

    schedule: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      startTime: {
        type: String,
        default: '00:00',
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide']
      },
      endTime: {
        type: String,
        default: '23:59',
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide']
      },
      daysOfWeek: {
        type: [Number],
        default: [0, 1, 2, 3, 4, 5, 6]
      }
    },

    // ========== STATUT ==========
    
    isActive: {
      type: Boolean,
      default: true
    },

    priority: {
      type: Number,  // Ordre d'affichage si plusieurs textes
      default: 1,
      min: 1
    },

    // ========== TRAÇABILITÉ ==========
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index
scrollingTextSchema.index({ isActive: 1 });
scrollingTextSchema.index({ priority: 1 });

module.exports = mongoose.model('ScrollingText', scrollingTextSchema);