const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  telefono: {
    type: String,
    trim: true
  },
  rol: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'pendiente'],
    default: 'activo'
  }
}, {
  timestamps: true
});

// Hash password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para generar token JWT
userSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: this._id, email: this.email, rol: this.rol },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = mongoose.model('User', userSchema);