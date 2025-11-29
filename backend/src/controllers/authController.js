const User = require('../models/User');
const { validationResult } = require('express-validator');

const authController = {
  // Registro de usuario
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Datos de registro inválidos',
          details: errors.array()
        });
      }

      const { nombre, email, password, telefono } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          error: 'El usuario ya existe',
          message: 'Ya existe un usuario registrado con este email'
        });
      }

      // Crear nuevo usuario
      const user = new User({
        nombre,
        email,
        password,
        telefono
      });

      await user.save();

      // Generar token
      const token = user.generateAuthToken();

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        },
        token
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo completar el registro'
      });
    }
  },

  // Login de usuario
  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Datos de login inválidos',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Buscar usuario
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos'
        });
      }

      // Verificar contraseña
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos'
        });
      }

      // Verificar estado del usuario
      if (user.estado !== 'activo') {
        return res.status(403).json({
          error: 'Cuenta inactiva',
          message: 'Tu cuenta no está activa. Contacta al administrador.'
        });
      }

      // Generar token
      const token = user.generateAuthToken();

      res.json({
        message: 'Login exitoso',
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        },
        token
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo completar el login'
      });
    }
  },

  // Obtener perfil de usuario
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json({
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          rol: user.rol,
          estado: user.estado,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el perfil del usuario'
      });
    }
  },

  // Actualizar perfil de usuario
  updateProfile: async (req, res) => {
    try {
      const { nombre, telefono } = req.body;
      const userId = req.user.id;

      const user = await User.findByIdAndUpdate(
        userId,
        { nombre, telefono },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        message: 'Perfil actualizado exitosamente',
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          rol: user.rol
        }
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el perfil'
      });
    }
  },

  // Cambiar contraseña
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Contraseña actual incorrecta'
        });
      }

      // Actualizar contraseña
      user.password = newPassword;
      await user.save();

      res.json({
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo cambiar la contraseña'
      });
    }
  }
};

module.exports = authController;