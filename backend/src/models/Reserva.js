const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  },
  espacio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Espacio',
    required: [true, 'El espacio es requerido']
  },
  fechaReserva: {
    type: Date,
    required: [true, 'La fecha de reserva es requerida']
  },
  horaInicio: {
    type: String,
    required: [true, 'La hora de inicio es requerida']
  },
  horaFin: {
    type: String,
    required: [true, 'La hora de fin es requerida']
  },
  duracion: {
    type: Number, // en minutos
    required: true
  },
  motivo: {
    type: String,
    required: [true, 'El motivo de la reserva es requerido'],
    maxlength: [300, 'El motivo no puede exceder los 300 caracteres']
  },
  cantidadPersonas: {
    type: Number,
    required: [true, 'La cantidad de personas es requerida'],
    min: [1, 'Debe haber al menos 1 persona']
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'rechazada'],
    default: 'pendiente'
  },
  notasAdministrador: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder los 500 caracteres']
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
reservaSchema.index({ espacio: 1, fechaReserva: 1 });
reservaSchema.index({ usuario: 1, fechaReserva: 1 });
reservaSchema.index({ estado: 1 });
reservaSchema.index({ fechaReserva: 1, horaInicio: 1, horaFin: 1 });

// Middleware para validar conflictos de horarios
reservaSchema.pre('save', async function(next) {
  if (this.isModified('estado') && this.estado === 'cancelada') {
    return next();
  }

  const Reserva = this.constructor;
  
  // Verificar conflictos de horario
  const conflicto = await Reserva.findOne({
    espacio: this.espacio,
    fechaReserva: this.fechaReserva,
    estado: { $in: ['pendiente', 'confirmada', 'en_curso'] },
    $or: [
      {
        $and: [
          { horaInicio: { $lt: this.horaFin } },
          { horaFin: { $gt: this.horaInicio } }
        ]
      }
    ],
    _id: { $ne: this._id }
  });

  if (conflicto) {
    return next(new Error('El espacio no está disponible en el horario seleccionado'));
  }

  next();
});

// Método estático para verificar disponibilidad
reservaSchema.statics.verificarDisponibilidad = async function(espacioId, fecha, horaInicio, horaFin, excludeReservaId = null) {
  const query = {
    espacio: espacioId,
    fechaReserva: fecha,
    estado: { $in: ['pendiente', 'confirmada', 'en_curso'] },
    $or: [
      {
        $and: [
          { horaInicio: { $lt: horaFin } },
          { horaFin: { $gt: horaInicio } }
        ]
      }
    ]
  };

  if (excludeReservaId) {
    query._id = { $ne: excludeReservaId };
  }

  const conflicto = await this.findOne(query);
  return !conflicto;
};

module.exports = mongoose.model('Reserva', reservaSchema);