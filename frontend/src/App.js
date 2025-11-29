import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Espacios from './pages/Espacios';
import Reservas from './pages/Reservas';
import MisReservas from './pages/MisReservas';
import Perfil from './pages/Perfil';
import Usuarios from './pages/Usuarios';
import Reportes from './pages/Reportes';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Rutas protegidas con layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="espacios" element={<Espacios />} />
          <Route path="reservas" element={<Reservas />} />
          <Route path="mis-reservas" element={<MisReservas />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;