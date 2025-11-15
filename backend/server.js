// Charger les variables d'environnement EN PREMIER
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');



// ========== IMPORTER TOUS LES MODÈLES (IMPORTANT) ==========
// Cela enregistre les modèles dans Mongoose
require('./models/Airport');
require('./models/Airline');
require('./models/User');
require('./models/Flight');
require('./models/Advertisement');
require('./models/ScrollingText');
require('./models/Log');


// Importer les routes
const authRoutes = require('./routes/auth');
// Importer la fonction de connexion DB
const connectDB = require('./config/database');
const airportRoutes = require('./routes/airports');  // ← NOUVEAU
const airlineRoutes = require('./routes/airlines');  // ← NOUVEAU
const flightRoutes = require('./routes/flights');

// Importer le middleware d'erreurs
const errorHandler = require('./middleware/errorHandler');

// ========== INITIALISATION ==========

const app = express();
const PORT = process.env.PORT || 5000;

// ========== CONNEXION BASE DE DONNÉES ==========

connectDB();

// ========== MIDDLEWARES GLOBAUX ==========

// Sécurité HTTP headers
app.use(helmet());

// CORS - Autoriser les requêtes depuis le frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parser JSON
app.use(express.json());

// Parser les données URL-encoded (formulaires)
app.use(express.urlencoded({ extended: true }));

// Logger les requêtes HTTP (seulement en développement)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ========== ROUTES ==========

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Gestion de Vols - Madagascar',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes des aéroports (SuperAdmin uniquement)
app.use('/api/airports', airportRoutes);  // ← NOUVEAU

// Routes des compagnies (SuperAdmin uniquement)
app.use('/api/airlines', airlineRoutes);  // ← NOUVEAU

// Routes des vols (SuperAdmin et Admin Regional)
app.use('/api/flights', flightRoutes); 

// Route 404 (route non trouvée)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`
  });
});

// ========== MIDDLEWARE DE GESTION D'ERREURS ==========

app.use(errorHandler);

// ========== DÉMARRAGE DU SERVEUR ==========

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🛫  SYSTÈME DE GESTION DE VOLS - MADAGASCAR  🛬    ║
║                                                       ║
║   Serveur démarré avec succès                        ║
║   Port: ${PORT}                                       ║
║   Environnement: ${process.env.NODE_ENV}             ║
║   URL: http://localhost:${PORT}                       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Gestion de la fermeture propre du serveur
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM reçu. Fermeture du serveur...');
  server.close(() => {
    console.log('🔴 Serveur fermé');
    mongoose.connection.close();
  });
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  server.close(() => process.exit(1));
});