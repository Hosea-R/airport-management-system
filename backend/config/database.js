const mongoose = require('mongoose');

/**
 * Fonction pour connecter à MongoDB
 * Utilise les variables d'environnement du fichier .env
 */
const connectDB = async () => {
  try {
    // Options de connexion pour éviter les warnings
    const options = {
      useNewUrlParser: true,      // Utilise le nouveau parser d'URL
      useUnifiedTopology: true,   // Utilise le nouveau moteur de gestion de serveur
    };

    // Connexion à MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    console.log(`📊 Base de données: ${conn.connection.name}`);
    
  } catch (error) {
    console.error(`❌ Erreur de connexion MongoDB: ${error.message}`);
    // Arrêter le processus si la connexion échoue
    process.exit(1);
  }
};

// Gérer les événements de connexion
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB déconnecté');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Erreur MongoDB: ${err}`);
});

module.exports = connectDB;