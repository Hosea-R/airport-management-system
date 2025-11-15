import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SuperAdminLayout from '../components/common/SuperAdminLayout';
import airportService from '../services/airportService';
import airlineService from '../services/airlineService';
import flightService from '../services/flightService';
import { 
  FaBuilding, 
  FaPlaneDeparture,
  FaPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaBan,
  FaArrowRight
} from 'react-icons/fa';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    airports: { total: 0, active: 0, inactive: 0 },
    airlines: { total: 0, active: 0, inactive: 0 },
    flights: { 
      total: 0, 
      scheduled: 0, 
      departed: 0, 
      landed: 0,
      delayed: 0,
      cancelled: 0 
    }
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

      // Charger les vols d'aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const flightsResponse = await flightService.getAll({ date: today });
      const flights = flightsResponse.data;

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
        },
        flights: {
          total: flights.length,
          scheduled: flights.filter(f => f.status === 'scheduled').length,
          departed: flights.filter(f => ['departed', 'in_air'].includes(f.status)).length,
          landed: flights.filter(f => f.status === 'landed').length,
          delayed: flights.filter(f => f.status === 'delayed').length,
          cancelled: flights.filter(f => f.status === 'cancelled').length
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
          {stats.active !== undefined && (
            <div className="flex items-center gap-1 text-green-600">
              <FaCheckCircle />
              <span>{stats.active} actif{stats.active > 1 ? 's' : ''}</span>
            </div>
          )}
          {stats.inactive !== undefined && stats.inactive > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <FaTimesCircle />
              <span>{stats.inactive} inactif{stats.inactive > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const FlightStatCard = () => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-500">
          <FaPlane className="text-2xl text-white" />
        </div>
        <Link 
          to="/superadmin/flights"
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm"
        >
          Gérer <FaArrowRight className="text-xs" />
        </Link>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Vols Aujourd'hui</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-gray-900">{stats.flights.total}</span>
          <span className="text-sm text-gray-500">Total</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-blue-600">
            <FaCheckCircle />
            <span>{stats.flights.scheduled} prévus</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-600">
            <FaPlane />
            <span>{stats.flights.departed} en vol</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <FaCheckCircle />
            <span>{stats.flights.landed} atterris</span>
          </div>
          <div className="flex items-center gap-1 text-orange-600">
            <FaClock />
            <span>{stats.flights.delayed} retardés</span>
          </div>
          {stats.flights.cancelled > 0 && (
            <div className="flex items-center gap-1 text-red-600 col-span-2">
              <FaBan />
              <span>{stats.flights.cancelled} annulés</span>
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

            {/* Vols */}
            <FlightStatCard />
          </div>
        )}

        {/* Section d'information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎉 Phase 3 Complétée !
          </h3>
          
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <div>
                <strong>Gestion des Vols :</strong> Créez des vols avec synchronisation automatique départ ↔ arrivée
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <div>
                <strong>Logique bidirectionnelle :</strong> Un seul vol créé génère automatiquement son jumeau
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <div>
                <strong>Gestion des statuts :</strong> Transitions validées, retards et annulations synchronisés
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <div>
                <strong>Interface Admin Régional :</strong> Gestion simplifiée des départs et suivi des arrivées
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Prochaine étape :</strong> Phase 4 - WebSocket temps réel pour synchroniser tous les clients instantanément
            </p>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;