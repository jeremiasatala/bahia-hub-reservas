const mongoose = require('mongoose');

const espacioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del espacio es requerido'],
    trim: true,
    unique: true,
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de espacio es requerido'],
    enum: ['sala_reuniones', 'aula', 'auditorio', 'oficina', 'coworking']
  },
  ubicacion: {
    type: String,
    required: [true, 'La ubicación es requerida'],
    trim: true
  },
  capacidad: {
    type: Number,
    required: [true, 'La capacidad es requerida'],
    min: [1, 'La capacidad debe ser al menos 1']
  },
  equipamiento: [{
    type: String,
    trim: true
  }],
  descripcion: {
    type: String,
    maxlength: [500, 'La descripción no puede exceder los 500 caracteres']
  },
  estado: {
    type: String,
    enum: ['disponible', 'mantenimiento', 'no_disponible'],
    default: 'disponible'
  },
  horariosDisponibles: {
    horaInicio: {
      type: String,
      default: '08:00'
    },
    horaFin: {
      type: String,
      default: '20:00'
    }
  },
  imagenes: [{
    url: String,
    descripcion: String
  }]
}, {
  timestamps: true
});

// Índice para búsquedas eficientes
espacioSchema.index({ nombre: 'text', descripcion: 'text', ubicacion: 'text' });
espacioSchema.index({ tipo: 1, estado: 1 });

module.exports = mongoose.model('Espacio', espacioSchema);