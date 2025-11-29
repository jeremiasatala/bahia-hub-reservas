import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Search, Filter, Edit, User, Mail, Phone, Shield } from 'lucide-react';
import { usuariosAPI } from '../services/api';
import toast from 'react-hot-toast';

const Usuarios = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    rol: '',
    estado: ''
  });

  const { data: usuarios, isLoading } = useQuery(
    ['usuarios', filters],
    () => usuariosAPI.getAll(filters).then(res => res.data)
  );

  const updateEstadoMutation = useMutation(
    ({ id, estado }) => usuariosAPI.updateEstado(id, { estado }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('usuarios');
        toast.success('Estado actualizado exitosamente');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error al actualizar estado');
      }
    }
  );

  const handleEstadoChange = (usuarioId, nuevoEstado) => {
    updateEstadoMutation.mutate({ id: usuarioId, estado: nuevoEstado });
  };

  const rolLabels = {
    user: 'Usuario',
    admin: 'Administrador'
  };

  const estadoColors = {
    activo: 'green',
    inactivo: 'red',
    pendiente: 'yellow'
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
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="mt-1 text-sm text-gray-600">
          Administra los usuarios del sistema Bahía Hub
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
                placeholder="Buscar usuarios..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              value={filters.rol}
              onChange={(e) => setFilters(prev => ({ ...prev, rol: e.target.value }))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">Todos los roles</option>
              {Object.entries(rolLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              value={filters.estado}
              onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', rol: '', estado: '' })}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {usuarios?.map((usuario) => (
            <li key={usuario._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {usuario.nombre}
                        </h3>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${estadoColors[usuario.estado]}-100 text-${estadoColors[usuario.estado]}-800 capitalize`}>
                          {usuario.estado}
                        </span>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {rolLabels[usuario.rol]}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {usuario.email}
                        </div>
                        {usuario.telefono && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {usuario.telefono}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Shield className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Registrado el {new Date(usuario.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <select
                      value={usuario.estado}
                      onChange={(e) => handleEstadoChange(usuario._id, e.target.value)}
                      className="block w-full sm:w-auto pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="pendiente">Pendiente</option>
                    </select>
                    
                    <button
                      onClick={() => {/* Implementar edición */}}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Estado vacío */}
        {!usuarios?.length && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron usuarios con los filtros aplicados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;