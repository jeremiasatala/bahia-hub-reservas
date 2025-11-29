import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUserProfile = async () => {
    try {
      const response = await authAPI.get('/auth/profile');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      
      toast.success('¡Bienvenido!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.post('/auth/register', userData);
      toast.success('¡Registro exitoso! Por favor inicia sesión.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error en el registro';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete authAPI.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Sesión cerrada');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.put('/auth/profile', profileData);
      setUser(response.data.user);
      toast.success('Perfil actualizado correctamente');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.put('/auth/change-password', passwordData);
      toast.success('Contraseña actualizada correctamente');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cambiar contraseña';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};