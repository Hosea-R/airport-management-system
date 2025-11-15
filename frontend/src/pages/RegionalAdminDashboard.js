import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaPlane, FaArrowRight } from 'react-icons/fa';

const RegionalAdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-600">
              Dashboard Admin Régional
            </h1>
            <p className="text-sm text-gray-600">
              {user?.airport?.name} ({user?.airport?.code}) - {user?.airport?.city}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FaSignOutAlt />
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carte Gestion des Vols */}
          <Link
            to="/admin/flights"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-primary-500">
                <FaPlane className="text-3xl text-white" />
              </div>
              <FaArrowRight className="text-gray-400 group-hover:text-primary-600 transition" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Gestion des Vols
            </h3>
            <p className="text-gray-600 text-sm">
              Créez et gérez les vols au départ de votre aéroport, suivez les arrivées attendues
            </p>
          </Link>

          {/* Carte Affichages Publics (Phase 7) */}
          <div className="bg-gray-50 rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-300">
                <span className="text-3xl">📺</span>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                Phase 7
              </span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              Affichages Publics
            </h3>
            <p className="text-gray-500 text-sm">
              Écrans publics pour les halls d'aéroport (disponible en Phase 7)
            </p>
          </div>
        </div>

        {/* Informations */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bienvenue, {user?.firstName} ! 👋
          </h3>
          <p className="text-gray-600 mb-4">
            Vous gérez l'aéroport de <strong>{user?.airport?.city}</strong> ({user?.airport?.code}).
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Vous pouvez créer des vols au départ de votre aéroport. 
              Chaque vol créé générera automatiquement un vol d'arrivée à l'aéroport de destination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalAdminDashboard;