import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Building,
  Users,
  MapPin
} from 'lucide-react';
import { espaciosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Espacios = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    tipo: '',
    estado: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [editingEspacio, setEditingEspacio] = useState(null);

  const { data: espacios, isLoading } = useQuery(
    ['espacios', filters],
    () => espaciosAPI.getAll(filters).then(res => res.data)
  );

  const createMutation = useMutation(espaciosAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('espacios');
      setShowModal(false);
      toast.success('Espacio creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear espacio');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => espaciosAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('espacios');
        setShowModal(false);
        setEditingEspacio(null);
        toast.success('Espacio actualizado exitosamente');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error al actualizar espacio');
      }
    }
  );

  const deleteMutation = useMutation(espaciosAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('espacios');
      toast.success('Espacio eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar espacio');
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    if (editingEspacio) {
      updateMutation.mutate({ id: editingEspacio._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (espacio) => {
    setEditingEspacio(espacio);
    reset(espacio);
    setShowModal(true);
  };

  const handleDelete = (espacio) => {
    if (window.confirm(`¿Estás seguro de eliminar el espacio "${espacio.nombre}"?`)) {
      deleteMutation.mutate(espacio._id);
    }
  };

  const handleCreate = () => {
    setEditingEspacio(null);
    reset({
      nombre: '',
      tipo: 'sala_reuniones',
      ubicacion: '',
      capacidad: 1,
      equipamiento: [],
      descripcion: ''
    });
    setShowModal(true);
  };

  const tipoLabels = {
    sala_reuniones: 'Sala de Reuniones',
    aula: 'Aula',
    auditorio: 'Auditorio',
    oficina: 'Oficina',
    coworking: 'Coworking'
  };

  const estadoColors = {
    disponible: 'green',
    mantenimiento: 'yellow',
    no_disponible: 'red'
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espacios</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona los espacios disponibles para reservas
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Espacio
          </button>
        )}
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
                placeholder="Buscar espacios..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={filters.tipo}
              onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(tipoLabels).map(([value, label]) => (
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
              <option value="disponible">Disponible</option>
              <option value="mantenimiento">En mantenimiento</option>
              <option value="no_disponible">No disponible</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', tipo: '', estado: '' })}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Grid de espacios */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {espacios?.espacios?.map((espacio) => (
          <div key={espacio._id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-primary-600" />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{espacio.nombre}</h3>
                    <p className="text-sm text-gray-500 capitalize">{tipoLabels[espacio.tipo]}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${estadoColors[espacio.estado]}-100 text-${estadoColors[espacio.estado]}-800 capitalize`}>
                  {espacio.estado}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {espacio.ubicacion}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  Capacidad: {espacio.capacidad} personas
                </div>
              </div>

              {espacio.descripcion && (
                <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                  {espacio.descripcion}
                </p>
              )}

              {espacio.equipamiento && espacio.equipamiento.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">Equipamiento:</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {espacio.equipamiento.map((equipo, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {equipo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleEdit(espacio)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(espacio)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal para crear/editar espacio */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">
                {editingEspacio ? 'Editar Espacio' : 'Nuevo Espacio'}
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    {...register('nombre', { required: 'El nombre es requerido' })}
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    {...register('tipo', { required: 'El tipo es requerido' })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    {Object.entries(tipoLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                  <input
                    {...register('ubicacion', { required: 'La ubicación es requerida' })}
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.ubicacion && (
                    <p className="mt-1 text-sm text-red-600">{errors.ubicacion.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacidad</label>
                  <input
                    {...register('capacidad', { 
                      required: 'La capacidad es requerida',
                      min: { value: 1, message: 'La capacidad debe ser al menos 1' }
                    })}
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.capacidad && (
                    <p className="mt-1 text-sm text-red-600">{errors.capacidad.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    {...register('descripcion')}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {createMutation.isLoading || updateMutation.isLoading ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      editingEspacio ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Espacios;