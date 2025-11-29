import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building, 
  Calendar, 
  Users, 
  FileText, 
  User,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onClose }) => {
  const { isAdmin } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Espacios', href: '/espacios', icon: Building },
    { name: 'Reservar', href: '/reservas', icon: Calendar },
    { name: 'Mis Reservas', href: '/mis-reservas', icon: Calendar },
    ...(isAdmin ? [
      { name: 'Usuarios', href: '/usuarios', icon: Users },
      { name: 'Reportes', href: '/reportes', icon: FileText },
    ] : []),
    { name: 'Mi Perfil', href: '/perfil', icon: User },
  ];

  return (
    <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
      {/* Logo y botón cerrar (móvil) */}
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <Building className="h-8 w-8 text-primary-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Bahía Hub</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon
              className={`mr-3 flex-shrink-0 h-6 w-6 ${
                window.location.pathname === item.href
                  ? 'text-primary-700'
                  : 'text-gray-400 group-hover:text-gray-500'
              }`}
            />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500">
          © 2023 Bahía Hub. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
};

export default Sidebar;