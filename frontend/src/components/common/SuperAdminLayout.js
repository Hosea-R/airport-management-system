import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaPlane,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBuilding,
  FaPlaneDeparture,
  FaChartLine,
  FaAd,
  FaScroll,
  FaTachometerAlt,
} from "react-icons/fa";

const SuperAdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/superadmin/dashboard",
      icon: FaTachometerAlt,
    },
    {
      name: "Aéroports",
      path: "/superadmin/airports",
      icon: FaBuilding,
    },
    {
      name: "Compagnies",
      path: "/superadmin/airlines",
      icon: FaPlaneDeparture,
    },
    {
      name: "Vols",
      path: "/superadmin/flights",
      icon: FaPlane,
      disabled: true, // Phase 3
    },
    {
      name: "Publicités",
      path: "/superadmin/advertisements",
      icon: FaAd,
      disabled: true, // Phase 6
    },
    {
      name: "Bandeaux",
      path: "/superadmin/scrolling-texts",
      icon: FaScroll,
      disabled: true, // Phase 6
    },
    {
      name: "Statistiques",
      path: "/superadmin/stats",
      icon: FaChartLine,
      disabled: true, // Phase 5
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-primary-800 text-white transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-primary-700 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <FaPlane className="text-2xl" />
                <span className="font-bold text-lg">Airport MG</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-primary-300 hover:text-white"
              >
                <FaTimes />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-primary-300 hover:text-white mx-auto"
            >
              <FaBars />
            </button>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.disabled ? "#" : item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  item.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : isActive
                    ? "bg-primary-700 text-white"
                    : "text-primary-100 hover:bg-primary-700"
                }`}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <Icon className="text-xl flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium">
                    {item.name}
                    {item.disabled && " (Bientôt)"}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-primary-700">
          {sidebarOpen ? (
            <div className="mb-3">
              <p className="text-sm text-primary-300">Connecté en tant que</p>
              <p className="font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-primary-400">{user?.email}</p>
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="font-bold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <FaSignOutAlt />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 overflow-x-hidden transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        } p-6`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard SuperAdmin
            </h1>
            <p className="text-sm text-gray-600">
              Gestion centrale des aéroports de Madagascar
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
