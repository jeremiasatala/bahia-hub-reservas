import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  Search,
  Filter
} from 'lucide-react';
import { reservasAPI } from '../services/api';
import toast from 'react-hot-toast';

const MisReservas = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    estado: ''
  });

  const { data: reservas, isLoading } = useQuery(
    ['mis-reservas', filters],
    () => reservasAPI.getMias(filters).then(res => res.data)
  );

  const cancelMutation = useMutation(reservasAPI.cancel, {
    onSuccess: () => {
      queryClient.invalidateQueries('mis-reservas');
      toast.success('Reserva cancelada exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cancelar reserva');
    }
  });

  const handleCancel = (reserva) => {
    if (window.confirm(`¿Estás seguro de cancelar la reserva del ${format(parseISO(reserva.fechaReserva), 'dd/MM/yyyy')}?`)) {
      cancelMutation.mutate(reserva._id);
    }
  };

  const estadoColors = {
    pendiente: 'yellow',
    confirmada: 'green',
    en_curso: 'blue',
    completada: 'gray',
    cancelada: 'red',
    rechazada: 'red'
  };

  const estadoLabels = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    en_curso: 'En curso',
    completada: 'Completada',
    cancelada: 'Cancelada',
    rechazada: 'Rechazada'
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Mis Reservas</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gestiona y revisa el historial de tus reservas
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Buscar</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Buscar por espacio..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              value={filters.estado}
              onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">Todos los estados</option>
              {Object.entries(estadoLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', estado: '' })}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de reservas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {reservas?.reservas?.map((reserva) => (
            <li key={reserva._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {reserva.espacio.nombre}
                        </h3>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${estadoColors[reserva.estado]}-100 text-${estadoColors[reserva.estado]}-800`}>
                          {estadoLabels[reserva.estado]}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {format(parseISO(reserva.fechaReserva), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {reserva.horaInicio} - {reserva.horaFin} ({reserva.duracion} min)
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {reserva.cantidadPersonas} personas
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {reserva.espacio.ubicacion}
                        </div>
                      </div>
                      {reserva.motivo && (
                        <p className="mt-2 text-sm text-gray-600">
                          <strong>Motivo:</strong> {reserva.motivo}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex space-x-2">
                    {['pendiente', 'confirmada'].includes(reserva.estado) && (
                      <>
                        <button
                          onClick={() => {/* Implementar edición */}}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleCancel(reserva)}
                          disabled={cancelMutation.isLoading}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Paginación */}
        {reservas?.pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{reservas.pagination.total > 0 ? (reservas.pagination.page - 1) * reservas.pagination.limit + 1 : 0}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(reservas.pagination.page * reservas.pagination.limit, reservas.pagination.total)}
                  </span>{' '}
                  de <span className="font-medium">{reservas.pagination.total}</span> resultados
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!reservas?.reservas?.length && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay reservas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza haciendo tu primera reserva.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/reservas'}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisReservas;