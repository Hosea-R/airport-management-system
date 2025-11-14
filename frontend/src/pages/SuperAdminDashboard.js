import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SuperAdminLayout from '../components/common/SuperAdminLayout';
import airportService from '../services/airportService';
import airlineService from '../services/airlineService';
import { 
  FaBuilding, 
  FaPlaneDeparture,
  FaPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight
} from 'react-icons/fa';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    airports: { total: 0, active: 0, inactive: 0 },
    airlines: { total: 0, active: 0, inactive: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Charger les aéroports
      const airportsResponse = await airportService.getAll();
      const airports = airportsResponse.data;
      
      // Charger les compagnies
      const airlinesResponse = await airlineService.getAll();
      const airlines = airlinesResponse.data;

      setStats({
        airports: {
          total: airports.length,
          active: airports.filter(a => a.isActive).length,
          inactive: airports.filter(a => !a.isActive).length
        },
        airlines: {
          total: airlines.length,
          active: airlines.filter(a => a.isActive).length,
          inactive: airlines.filter(a => !a.isActive).length
        }
      });
    } catch (error) {
      console.error('Erreur de chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, icon: Icon, stats, link, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="text-2xl text-white" />
        </div>
        <Link 
          to={link}
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm"
        >
          Gérer <FaArrowRight className="text-xs" />
        </Link>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
          <span className="text-sm text-gray-500">Total</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <FaCheckCircle />
            <span>{stats.active} actif{stats.active > 1 ? 's' : ''}</span>
          </div>
          {stats.inactive > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <FaTimesCircle />
              <span>{stats.inactive} inactif{stats.inactive > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Titre */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble du système de gestion de vols
          </p>
        </div>

        {/* Cartes de statistiques */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Aéroports */}
            <StatCard
              title="Aéroports"
              icon={FaBuilding}
              stats={stats.airports}
              link="/superadmin/airports"
              color="bg-blue-500"
            />

            {/* Compagnies */}
            <StatCard
              title="Compagnies Aériennes"
              icon={FaPlaneDeparture}
              stats={stats.airlines}
              link="/superadmin/airlines"
              color="bg-green-500"
            />

            {/* Vols - Placeholder pour Phase 3 */}
            <div className="bg-gray-50 rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-300">
                  <FaPlane className="text-2xl text-gray-500" />
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                  Phase 3
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-500 mb-2">Vols</h3>
              <p className="text-sm text-gray-500">
                La gestion des vols sera disponible en Phase 3
              </p>
            </div>
          </div>
        )}

        {/* Section d'information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎉 Phase 2 Complétée !
          </h3>
          
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <div>
                <strong>Gestion des Aéroports :</strong> Créez, modifiez et supprimez les aéroports de Madagascar
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <div>
                <strong>Gestion des Compagnies :</strong> Administrez les compagnies aériennes opérant à Madagascar
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <div>
                <strong>Interface intuitive :</strong> Design moderne avec filtres, recherche et validation en temps réel
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Prochaine étape :</strong> Phase 3 - Gestion des Vols avec logique bidirectionnelle (départ/arrivée automatique)
            </p>
          </div>
        </div>

        {/* Liste des aéroports (aperçu rapide) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Aéroports Récents</h3>
            <Link 
              to="/superadmin/airports"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Voir tous
            </Link>
          </div>
          
          <p className="text-gray-600 text-sm">
            {stats.airports.total} aéroport{stats.airports.total > 1 ? 's' : ''} configuré{stats.airports.total > 1 ? 's' : ''} dans le système
          </p>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;