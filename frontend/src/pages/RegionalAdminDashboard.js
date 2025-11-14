import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt } from 'react-icons/fa';

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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Bienvenue, Admin ! 🎉
          </h2>
          <p className="text-gray-600">
            Vous gérez l'aéroport de <strong>{user?.airport?.city}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegionalAdminDashboard;