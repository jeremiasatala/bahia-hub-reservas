import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuración global de axios
export const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.REACT_APP_API_KEY || 'bahiahub-api-key-2023'
  }
});

// Interceptor para manejar errores globalmente
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const espaciosAPI = {
  getAll: (params) => authAPI.get('/espacios', { params }),
  getById: (id) => authAPI.get(`/espacios/${id}`),
  getDisponibilidad: (id, fecha) => authAPI.get(`/espacios/${id}/disponibilidad?fecha=${fecha}`),
  create: (data) => authAPI.post('/espacios', data),
  update: (id, data) => authAPI.put(`/espacios/${id}`, data),
  delete: (id) => authAPI.delete(`/espacios/${id}`),
  updateEstado: (id, estado) => authAPI.patch(`/espacios/${id}/estado`, { estado })
};

export const reservasAPI = {
  getMias: (params) => authAPI.get('/reservas/usuario', { params }),
  getAll: (params) => authAPI.get('/reservas/admin/todas', { params }),
  getById: (id) => authAPI.get(`/reservas/${id}`),
  create: (data) => authAPI.post('/reservas', data),
  update: (id, data) => authAPI.put(`/reservas/${id}`, data),
  cancel: (id) => authAPI.delete(`/reservas/${id}`),
  updateEstado: (id, estado) => authAPI.patch(`/reservas/${id}/estado`, { estado }),
  addNotas: (id, notas) => authAPI.put(`/reservas/${id}/notas`, { notas })
};

export const reportesAPI = {
  getUsoEspacios: (params) => authAPI.get('/reportes/uso-espacios', { params }),
  getReservas: (params) => authAPI.get('/reportes/reservas', { params }),
  getUsuarios: (params) => authAPI.get('/reportes/usuarios', { params }),
  generarPDF: (data) => authAPI.post('/reportes/generar-pdf', data, { responseType: 'blob' }),
  generarExcel: (data) => authAPI.post('/reportes/generar-excel', data, { responseType: 'blob' })
};

export const usuariosAPI = {
  getAll: (params) => authAPI.get('/users', { params }),
  getById: (id) => authAPI.get(`/users/${id}`),
  update: (id, data) => authAPI.put(`/users/${id}`, data),
  updateEstado: (id, estado) => authAPI.patch(`/users/${id}/estado`, { estado })
};