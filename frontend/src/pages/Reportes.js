import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Download, 
  FileText, 
  PieChart, 
  Users, 
  Building,
  Calendar 
} from 'lucide-react';
import { reportesAPI } from '../services/api';

const Reportes = () => {
  const [reporteActivo, setReporteActivo] = useState('uso-espacios');
  const [filtros, setFiltros] = useState({
    fechaInicio: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    fechaFin: format(new Date(), 'yyyy-MM-dd'),
    tipo: '',
    espacio: ''
  });

  const { data: reporteUso, isLoading: loadingUso } = useQuery(
    ['reporte-uso', filtros],
    () => reportesAPI.getUsoEspacios(filtros).then(res => res.data),
    { enabled: reporteActivo === 'uso-espacios' }
  );

  const { data: reporteReservas, isLoading: loadingReservas } = useQuery(
    ['reporte-reservas', filtros],
    () => reportesAPI.getReservas(filtros).then(res => res.data),
    { enabled: reporteActivo === 'reservas' }
  );

  const { data: reporteUsuarios, isLoading: loadingUsuarios } = useQuery(
    ['reporte-usuarios', filtros],
    () => reportesAPI.getUsuarios(filtros).then(res => res.data),
    { enabled: reporteActivo === 'usuarios' }
  );

  const isLoading = loadingUso || loadingReservas || loadingUsuarios;

  const handleGenerarReporte = async (formato) => {
    try {
      let response;
      if (formato === 'pdf') {
        response = await reportesAPI.generarPDF({
          tipo: reporteActivo,
          parametros: filtros
        });
        // Descargar PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-${reporteActivo}-${Date.now()}.pdf`;
        link.click();
      } else {
        response = await reportesAPI.generarExcel({
          tipo: reporteActivo,
          parametros: filtros
        });
        // Descargar Excel
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-${reporteActivo}-${Date.now()}.xlsx`;
        link.click();
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
    }
  };

  const tiposReporte = [
    {
      id: 'uso-espacios',
      nombre: 'Uso de Espacios',
      icon: Building,
      descripcion: 'Estadísticas de utilización de espacios'
    },
    {
      id: 'reservas',
      nombre: 'Reservas',
      icon: Calendar,
      descripcion: 'Reporte detallado de reservas'
    },
    {
      id: 'usuarios',
      nombre: 'Usuarios',
      icon: Users,
      descripcion: 'Actividad y estadísticas de usuarios'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Genera reportes y estadísticas del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar de tipos de reporte */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Tipos de Reporte</h3>
            </div>
            <nav className="p-4 space-y-2">
              {tiposReporte.map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => setReporteActivo(tipo.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    reporteActivo === tipo.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <tipo.icon className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-medium">{tipo.nombre}</div>
                      <div className="text-sm opacity-75">{tipo.descripcion}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenido del reporte */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filtros */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => handleGenerarReporte('pdf')}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </button>
                <button
                  onClick={() => handleGenerarReporte('excel')}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </button>
              </div>
            </div>
          </div>

          {/* Resultados del reporte */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {tiposReporte.find(t => t.id === reporteActivo)?.nombre}
              </h3>
              <div className="text-sm text-gray-500">
                Generado el {new Date().toLocaleDateString('es-ES')}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Reporte de Uso de Espacios */}
                {reporteActivo === 'uso-espacios' && reporteUso && (
                  <div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {reporteUso.totalEspacios}
                        </div>
                        <div className="text-sm text-gray-600">Espacios analizados</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {reporteUso.reporte.reduce((sum, item) => sum + item.totalReservas, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Total reservas</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {(reporteUso.reporte.reduce((sum, item) => sum + item.horasUtilizadas, 0) / 60).toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Horas totales</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Espacio
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reservas
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Horas
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Promedio Personas
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reporteUso.reporte.map((item) => (
                            <tr key={item._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                {item.tipo}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.totalReservas}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(item.horasUtilizadas / 60).toFixed(1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.promedioPersonas?.toFixed(1) || '0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Reporte de Reservas */}
                {reporteActivo === 'reservas' && reporteReservas && (
                  <div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {reporteReservas.estadisticas.total}
                        </div>
                        <div className="text-sm text-gray-600">Total reservas</div>
                      </div>
                      {Object.entries(reporteReservas.estadisticas.porEstado).map(([estado, count]) => (
                        <div key={estado} className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {count}
                          </div>
                          <div className="text-sm text-gray-600 capitalize">{estado}</div>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Espacio
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Horario
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reporteReservas.reservas.slice(0, 10).map((reserva) => (
                            <tr key={reserva._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(reserva.fechaReserva), 'dd/MM/yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {reserva.espacio?.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {reserva.usuario?.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {reserva.horaInicio} - {reserva.horaFin}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${estadoColors[reserva.estado]}-100 text-${estadoColors[reserva.estado]}-800 capitalize`}>
                                  {reserva.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Reporte de Usuarios */}
                {reporteActivo === 'usuarios' && reporteUsuarios && (
                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <div className="text-2xl font-bold text-gray-900">
                        {reporteUsuarios.totalUsuarios}
                      </div>
                      <div className="text-sm text-gray-600">Usuarios activos en el período</div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Reservas
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Horas Totales
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Primera Reserva
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Última Reserva
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reporteUsuarios.reporte.map((usuario) => (
                            <tr key={usuario._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {usuario.usuario}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {usuario.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {usuario.totalReservas}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(usuario.totalHoras / 60).toFixed(1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {usuario.primeraReserva ? format(new Date(usuario.primeraReserva), 'dd/MM/yyyy') : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {usuario.ultimaReserva ? format(new Date(usuario.ultimaReserva), 'dd/MM/yyyy') : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Colores para estados (debe coincidir con los usados en otros componentes)
const estadoColors = {
  pendiente: 'yellow',
  confirmada: 'green',
  en_curso: 'blue',
  completada: 'gray',
  cancelada: 'red',
  rechazada: 'red'
};

export default Reportes;