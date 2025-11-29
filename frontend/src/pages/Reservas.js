import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Users, Search } from 'lucide-react';
import { espaciosAPI, reservasAPI } from '../services/api';
import toast from 'react-hot-toast';

const Reservas = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEspacio, setSelectedEspacio] = useState(null);
  const [showReservaModal, setShowReservaModal] = useState(false);

  const { data: espacios, isLoading: espaciosLoading } = useQuery(
    'espacios-disponibles',
    () => espaciosAPI.getAll({ estado: 'disponible' }).then(res => res.data.espacios)
  );

  const { data: disponibilidad, isLoading: disponibilidadLoading } = useQuery(
    ['disponibilidad', selectedEspacio, selectedDate],
    () => {
      if (selectedEspacio && selectedDate) {
        return espaciosAPI.getDisponibilidad(selectedEspacio, selectedDate)
          .then(res => res.data);
      }
      return null;
    },
    { enabled: !!selectedEspacio && !!selectedDate }
  );

  const createReservaMutation = useMutation(reservasAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('disponibilidad');
      setShowReservaModal(false);
      toast.success('Reserva creada exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear reserva');
    }
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const horaInicio = watch('horaInicio');
  const horaFin = watch('horaFin');

  const onSubmitReserva = (data) => {
    const reservaData = {
      ...data,
      espacio: selectedEspacio,
      fechaReserva: selectedDate
    };
    createReservaMutation.mutate(reservaData);
  };

  const handleEspacioSelect = (espacioId) => {
    setSelectedEspacio(espacioId);
    setShowReservaModal(true);
    reset({
      horaInicio: '',
      horaFin: '',
      motivo: '',
      cantidadPersonas: 1
    });
  };

  const calcularDuracion = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return 0;
    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFin.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  };

  const duracion = calcularDuracion(horaInicio, horaFin);

  const tipoLabels = {
    sala_reuniones: 'Sala de Reuniones',
    aula: 'Aula',
    auditorio: 'Auditorio',
    oficina: 'Oficina',
    coworking: 'Coworking'
  };

  if (espaciosLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900">Nueva Reserva</h1>
        <p className="mt-1 text-sm text-gray-600">
          Selecciona un espacio y fecha para realizar tu reserva
        </p>
      </div>

      {/* Selector de fecha */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
              Fecha de reserva
            </label>
            <input
              type="date"
              id="fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid de espacios */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {espacios?.map((espacio) => (
          <div key={espacio._id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{espacio.nombre}</h3>
                    <p className="text-sm text-gray-500 capitalize">{tipoLabels[espacio.tipo]}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  Capacidad: {espacio.capacidad} personas
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Horario: {espacio.horariosDisponibles.horaInicio} - {espacio.horariosDisponibles.horaFin}
                </div>
              </div>

              {espacio.descripcion && (
                <p className="mt-3 text-sm text-gray-500">
                  {espacio.descripcion}
                </p>
              )}

              <div className="mt-4">
                <button
                  onClick={() => handleEspacioSelect(espacio._id)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Ver disponibilidad
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de reserva */}
      {showReservaModal && selectedEspacio && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Realizar Reserva
              </h3>

              {disponibilidadLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitReserva)} className="space-y-4">
                  {/* Información del espacio y fecha */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">
                      {espacios?.find(e => e._id === selectedEspacio)?.nombre}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>

                  {/* Horarios disponibles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Horario disponible
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Hora inicio</label>
                        <select
                          {...register('horaInicio', { required: 'Selecciona hora de inicio' })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        >
                          <option value="">Seleccionar</option>
                          {disponibilidad?.horariosDisponibles?.map((hora) => (
                            <option key={hora} value={hora}>{hora}</option>
                          ))}
                        </select>
                        {errors.horaInicio && (
                          <p className="mt-1 text-sm text-red-600">{errors.horaInicio.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Hora fin</label>
                        <select
                          {...register('horaFin', { required: 'Selecciona hora de fin' })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        >
                          <option value="">Seleccionar</option>
                          {disponibilidad?.horariosDisponibles?.map((hora) => (
                            <option key={hora} value={hora}>{hora}</option>
                          ))}
                        </select>
                        {errors.horaFin && (
                          <p className="mt-1 text-sm text-red-600">{errors.horaFin.message}</p>
                        )}
                      </div>
                    </div>
                    {duracion > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        Duración: {duracion} minutos
                      </p>
                    )}
                  </div>

                  {/* Cantidad de personas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cantidad de personas
                    </label>
                    <input
                      {...register('cantidadPersonas', {
                        required: 'La cantidad de personas es requerida',
                        min: { value: 1, message: 'Mínimo 1 persona' },
                        max: { 
                          value: espacios?.find(e => e._id === selectedEspacio)?.capacidad,
                          message: `La capacidad máxima es ${espacios?.find(e => e._id === selectedEspacio)?.capacidad} personas`
                        }
                      })}
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    {errors.cantidadPersonas && (
                      <p className="mt-1 text-sm text-red-600">{errors.cantidadPersonas.message}</p>
                    )}
                  </div>

                  {/* Motivo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Motivo de la reserva
                    </label>
                    <textarea
                      {...register('motivo', {
                        required: 'El motivo es requerido',
                        minLength: { value: 5, message: 'Mínimo 5 caracteres' }
                      })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Describe el propósito de tu reserva..."
                    />
                    {errors.motivo && (
                      <p className="mt-1 text-sm text-red-600">{errors.motivo.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowReservaModal(false)}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createReservaMutation.isLoading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {createReservaMutation.isLoading ? (
                        <div className="loading-spinner"></div>
                      ) : (
                        'Confirmar Reserva'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservas;