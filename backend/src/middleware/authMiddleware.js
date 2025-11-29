const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'Token de autenticación requerido'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Usuario no encontrado'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Token inválido',
      message: 'Error al verificar el token de autenticación'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren privilegios de administrador'
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };