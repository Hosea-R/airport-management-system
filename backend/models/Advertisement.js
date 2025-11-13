const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema(
  {
    // Titre de la publicité
    title: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
      maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
    },

    // Type de média
    type: {
      type: String,
      enum: {
        values: ['video', 'image'],
        message: 'Le type doit être "video" ou "image"'
      },
      required: [true, 'Le type de média est obligatoire']
    },

    // URL du média (Imgur)
    mediaUrl: {
      type: String,
      required: [true, 'L\'URL du média est obligatoire'],
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'L\'URL doit être valide'
      }
    },

    // Miniature (optionnel)
    thumbnailUrl: {
      type: String,
      default: null
    },

    // Durée d'affichage en secondes
    duration: {
      type: Number,
      required: [true, 'La durée est obligatoire'],
      min: [5, 'La durée minimale est de 5 secondes'],
      max: [120, 'La durée maximale est de 120 secondes'],
      default: 15
    },

    // ========== CIBLAGE ==========
    
    // Aéroports ciblés (vide = tous les aéroports)
    targetAirports: [{
      type: String,
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'Code aéroport invalide']
    }],

    // Types d'écrans ciblés
    displayOn: [{
      type: String,
      enum: ['arrivals', 'departures', 'general']
    }],

    // ========== PROGRAMMATION ==========
    
    schedulingType: {
      type: String,
      enum: ['manual', 'scheduled', 'always'],
      default: 'scheduled'
    },

    // Configuration de la programmation
    schedule: {
      startDate: {
        type: Date,
        default: null
      },
      endDate: {
        type: Date,
        default: null
      },
      startTime: {
        type: String,  // Format "HH:MM"
        default: '00:00',
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)']
      },
      endTime: {
        type: String,
        default: '23:59',
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)']
      },
      daysOfWeek: {
        type: [Number],  // 0=Dimanche, 1=Lundi, ..., 6=Samedi
        default: [0, 1, 2, 3, 4, 5, 6],
        validate: {
          validator: function(arr) {
            return arr.every(day => day >= 0 && day <= 6);
          },
          message: 'Les jours doivent être entre 0 (dimanche) et 6 (samedi)'
        }
      },
      frequency: {
        type: Number,  // Afficher toutes les X diffusions
        default: 1,
        min: [1, 'La fréquence minimale est de 1']
      }
    },

    // ========== STATUT ==========
    
    isActive: {
      type: Boolean,
      default: true
    },

    isPriority: {
      type: Boolean,
      default: false
    },

    // Déclenchement manuel
    manuallyTriggered: {
      type: Boolean,
      default: false
    },

    // ========== STATISTIQUES ==========
    
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },

    lastDisplayed: {
      type: Date,
      default: null
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

// Index pour les requêtes fréquentes
advertisementSchema.index({ isActive: 1 });
advertisementSchema.index({ schedulingType: 1 });
advertisementSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
advertisementSchema.index({ viewCount: 1 });

/**
 * Validation : Si scheduled, les dates doivent être fournies
 */
advertisementSchema.pre('save', function(next) {
  if (this.schedulingType === 'scheduled') {
    if (!this.schedule.startDate || !this.schedule.endDate) {
      return next(new Error('Les dates de début et fin sont obligatoires pour une programmation'));
    }
    if (this.schedule.endDate < this.schedule.startDate) {
      return next(new Error('La date de fin doit être après la date de début'));
    }
  }
  next();
});

module.exports = mongoose.model('Advertisement', advertisementSchema);