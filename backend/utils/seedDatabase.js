require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Importer les modèles
const Airport = require("../models/Airport");
const Airline = require("../models/Airline");
const User = require("../models/User");

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connecté");
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
    process.exit(1);
  }
};

/**
 * Données des aéroports de Madagascar
 */
const airportsData = [
  {
    code: "TNR",
    name: "Ivato",
    city: "Antananarivo",
    region: "Analamanga",
    isActive: true,
    isCentral: true, // Aéroport central
  },
  {
    code: "NOS",
    name: "Fascene",
    city: "Nosy Be",
    region: "Diana",
    isActive: true,
    isCentral: false,
  },
  {
    code: "TMM",
    name: "Toamasina",
    city: "Toamasina",
    region: "Atsinanana",
    isActive: true,
    isCentral: false,
  },
  {
    code: "DIE",
    name: "Arrachart",
    city: "Antsiranana",
    region: "Diana",
    isActive: true,
    isCentral: false,
  },
  {
    code: "MJN",
    name: "Amborovy",
    city: "Mahajanga",
    region: "Boeny",
    isActive: true,
    isCentral: false,
  },
  {
    code: "FTU",
    name: "Tolagnaro",
    city: "Fort Dauphin",
    region: "Anosy",
    isActive: true,
    isCentral: false,
  },
  {
    code: "TLE",
    name: "Toliara",
    city: "Toliara",
    region: "Atsimo-Andrefana",
    isActive: true,
    isCentral: false,
  },
  {
    code: "WVK",
    name: "Manakara",
    city: "Manakara",
    region: "Vatovavy-Fitovinany",
    isActive: true,
    isCentral: false,
  },
];

/**
 * Données des compagnies aériennes
 */
const airlinesData = [
  {
    code: "MD",
    name: "Air Madagascar",
    logo: null,
    isActive: true,
  },
  {
    code: "TZ",
    name: "Tsaradia",
    logo: null,
    isActive: true,
  },
  {
    code: "ZA",
    name: "Madagascar Airlines",
    logo: null,
    isActive: true,
  },
];

/**
 * Fonction principale de seed
 */
const seedDatabase = async () => {
  try {
    console.log("🌱 Début du seed...\n");

    // ========== 1. SUPPRIMER LES DONNÉES EXISTANTES ==========

    console.log("🗑️  Suppression des données existantes...");
    await Airport.deleteMany({});
    await Airline.deleteMany({});
    await User.deleteMany({});
    console.log("✅ Données supprimées\n");

    // ========== 2. CRÉER LES AÉROPORTS ==========

    console.log("🛫 Création des aéroports...");
    const airports = await Airport.insertMany(airportsData);
    console.log(`✅ ${airports.length} aéroports créés:`);
    airports.forEach((a) =>
      console.log(`   - ${a.code} (${a.name}, ${a.city})`)
    );
    console.log("");

    // ========== 3. CRÉER LES COMPAGNIES ==========

    console.log("✈️  Création des compagnies...");
    const airlines = await Airline.insertMany(airlinesData);
    console.log(`✅ ${airlines.length} compagnies créées:`);
    airlines.forEach((a) => console.log(`   - ${a.code} (${a.name})`));
    console.log("");

    // ========== 4. CRÉER LES UTILISATEURS ==========

    console.log("👤 Création des utilisateurs...");

    // SuperAdmin
    const superAdmin = await User.create({
      email: "superadmin@airport.mg",
      password: "admin123", // Sera hashé automatiquement
      firstName: "Super",
      lastName: "Admin",
      role: "superadmin",
      airportId: null,
      isActive: true,
    });
    console.log(`✅ SuperAdmin créé: ${superAdmin.email}`);

    // Admin régional Antananarivo (TNR)
    const tnrAirport = airports.find((a) => a.code === "TNR");
    const adminTNR = await User.create({
      email: "admin.tnr@airport.mg",
      password: "admin123",
      firstName: "Admin",
      lastName: "Antananarivo",
      role: "admin_regional",
      airportId: tnrAirport._id,
      isActive: true,
    });
    console.log(`✅ Admin TNR créé: ${adminTNR.email}`);

    // Admin régional Toamasina (TMM)
    const tmmAirport = airports.find((a) => a.code === "TMM");
    const adminTMM = await User.create({
      email: "admin.tmm@airport.mg",
      password: "admin123",
      firstName: "Admin",
      lastName: "Toamasina",
      role: "admin_regional",
      airportId: tmmAirport._id,
      isActive: true,
    });
    console.log(`✅ Admin TMM créé: ${adminTMM.email}`);

    // Admin régional Nosy Be (NOS)
    const nosAirport = airports.find((a) => a.code === "NOS");
    const adminNOS = await User.create({
      email: "admin.nos@airport.mg",
      password: "admin123",
      firstName: "Admin",
      lastName: "Nosy Be",
      role: "admin_regional",
      airportId: nosAirport._id,
      isActive: true,
    });
    console.log(`✅ Admin NOS créé: ${adminNOS.email}`);

    console.log("\n");

    // ========== 5. RÉSUMÉ ==========

    console.log("╔═══════════════════════════════════════════════════╗");
    console.log("║                                                   ║");
    console.log("║           🎉 SEED TERMINÉ AVEC SUCCÈS 🎉          ║");
    console.log("║                                                   ║");
    console.log("╚═══════════════════════════════════════════════════╝");
    console.log("");
    console.log("📊 RÉSUMÉ:");
    console.log(`   - Aéroports: ${airports.length}`);
    console.log(`   - Compagnies: ${airlines.length}`);
    console.log(`   - Utilisateurs: 4`);
    console.log("");
    console.log("🔑 COMPTES DE TEST:");
    console.log("");
    console.log("   SuperAdmin:");
    console.log("   Email: superadmin@airport.mg");
    console.log("   Password: admin123");
    console.log("");
    console.log("   Admin Antananarivo (TNR):");
    console.log("   Email: admin.tnr@airport.mg");
    console.log("   Password: admin123");
    console.log("");
    console.log("   Admin Toamasina (TMM):");
    console.log("   Email: admin.tmm@airport.mg");
    console.log("   Password: admin123");
    console.log("");
    console.log("   Admin Nosy Be (NOS):");
    console.log("   Email: admin.nos@airport.mg");
    console.log("   Password: admin123");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    process.exit(1);
  }
};

// Exécuter le seed
connectDB().then(() => {
  seedDatabase();
});
