import React from 'react';
import { useQuery } from 'react-query';
import { 
  Building, 
  Calendar, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reservasAPI } from '../services/api';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  const { data: estadisticas, isLoading } = useQuery(
    'dashboard-stats',
    async () => {
      if (isAdmin) {
        const [reservasRes] = await Promise.all([
          reservasAPI.getAll({ page: 1, limit: 100 })
        ]);
        return {
          totalReservas: reservasRes.data.reservas.length,
          reservasHoy: reservasRes.data.reservas.filter(r => 
            new Date(r.fechaReserva).toDateString() === new Date().toDateString()
          ).length,
          reservasPendientes: reservasRes.data.reservas.filter(r => 
            r.estado === 'pendiente'
          ).length,
          reservasConfirmadas: reservasRes.data.reservas.filter(r => 
            r.estado === 'confirmada'
          ).length,
        };
      } else {
        const [misReservasRes] = await Promise.all([
          reservasAPI.getMias({ page: 1, limit: 100 })
        ]);
        return {
          misReservas: misReservasRes.data.reservas.length,
          reservasProximas: misReservasRes.data.reservas.filter(r => 
            new Date(r.fechaReserva) >= new Date() && 
            ['pendiente', 'confirmada'].includes(r.estado)
          ).length,
          reservasCompletadas: misReservasRes.data.reservas.filter(r => 
            r.estado === 'completada'
          ).length,
          reservasCanceladas: misReservasRes.data.reservas.filter(r => 
            r.estado === 'cancelada'
          ).length,
        };
      }
    },
    { enabled: !!user }
  );

  const stats = isAdmin ? [
    {
      name: 'Total Reservas',
      value: estadisticas?.totalReservas || 0,
      icon: Calendar,
      color: 'blue'
    },
    {
      name: 'Reservas Hoy',
      value: estadisticas?.reservasHoy || 0,
      icon: Clock,
      color: 'green'
    },
    {
      name: 'Pendientes',
      value: estadisticas?.reservasPendientes || 0,
      icon: Clock,
      color: 'yellow'
    },
    {
      name: 'Confirmadas',
      value: estadisticas?.reservasConfirmadas || 0,
      icon: CheckCircle,
      color: 'green'
    }
  ] : [
    {
      name: 'Mis Reservas',
      value: estadisticas?.misReservas || 0,
      icon: Calendar,
      color: 'blue'
    },
    {
      name: 'Próximas',
      value: estadisticas?.reservasProximas || 0,
      icon: Clock,
      color: 'green'
    },
    {
      name: 'Completadas',
      value: estadisticas?.reservasCompletadas || 0,
      icon: CheckCircle,
      color: 'green'
    },
    {
      name: 'Canceladas',
      value: estadisticas?.reservasCanceladas || 0,
      icon: XCircle,
      color: 'red'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Hola, {user?.nombre}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Bienvenido al sistema de reservas de Bahía Hub
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card de bienvenida */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/reservas'}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-primary-600 mr-3" />
                <span className="font-medium">Hacer una reserva</span>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/mis-reservas'}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-primary-600 mr-3" />
                <span className="font-medium">Ver mis reservas</span>
              </div>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => window.location.href = '/espacios'}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-primary-600 mr-3" />
                    <span className="font-medium">Gestionar espacios</span>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = '/reportes'}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-primary-600 mr-3" />
                    <span className="font-medium">Ver reportes</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Información Bahía Hub */}
        <div className="bg-primary-50 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-primary-900 mb-4">
            Bahía Hub
          </h3>
          <p className="text-primary-700 mb-4">
            Centro de innovación de la municipalidad de Bahía Blanca. 
            Espacios para charlas, capacitaciones, talleres y reuniones.
          </p>
          <div className="space-y-2 text-sm text-primary-600">
            <p>📍 Dirección: [Dirección del Bahía Hub]</p>
            <p>📞 Teléfono: [Teléfono de contacto]</p>
            <p>🕒 Horario: Lunes a Viernes 8:00 - 20:00</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;