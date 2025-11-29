import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Botón menú móvil */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Espacio para título de página - se llena dinámicamente */}
          <div className="flex-1"></div>

          {/* Menú usuario */}
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <Bell className="h-6 w-6" />
            </button>

            {/* Perfil */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.nombre}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.rol}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón cerrar sesión */}
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;