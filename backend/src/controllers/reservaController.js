const Reserva = require('../models/Reserva');
const Espacio = require('../models/Espacio');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const reservaController = {
  // Obtener reservas del usuario actual
  getReservasUsuario: async (req, res) => {
    try {
      const { page = 1, limit = 10, estado } = req.query;
      const userId = req.user.id;
      
      let query = { usuario: userId };
      if (estado) query.estado = estado;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { fechaReserva: -1, horaInicio: -1 },
        populate: 'espacio'
      };
      
      const skip = (options.page - 1) * options.limit;
      const reservas = await Reserva.find(query)
        .skip(skip)
        .limit(options.limit)
        .sort(options.sort)
        .populate('espacio', 'nombre ubicacion capacidad');
      
      const total = await Reserva.countDocuments(query);
      
      res.json({
        reservas,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      console.error('Error obteniendo reservas:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las reservas'
      });
    }
  },

  // Obtener todas las reservas (admin)
  getAllReservas: async (req, res) => {
    try {
      const { page = 1, limit = 10, estado, espacio, fecha } = req.query;
      
      let query = {};
      if (estado) query.estado = estado;
      if (espacio) query.espacio = espacio;
      if (fecha) query.fechaReserva = new Date(fecha);
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { fechaReserva: -1, horaInicio: -1 }
      };
      
      const skip = (options.page - 1) * options.limit);
      const reservas = await Reserva.find(query)
        .skip(skip)
        .limit(options.limit)
        .sort(options.sort)
        .populate('espacio', 'nombre ubicacion')
        .populate('usuario', 'nombre email');
      
      const total = await Reserva.countDocuments(query);
      
      res.json({
        reservas,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      console.error('Error obteniendo reservas:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las reservas'
      });
    }
  },

  // Obtener reserva por ID
  getReservaById: async (req, res) => {
    try {
      const reserva = await Reserva.findById(req.params.id)
        .populate('espacio')
        .populate('usuario', 'nombre email telefono');
      
      if (!reserva) {
        return res.status(404).json({
          error: 'Reserva no encontrada'
        });
      }
      
      // Verificar que el usuario puede ver esta reserva
      if (req.user.rol !== 'admin' && reserva.usuario._id.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'No tienes permiso para ver esta reserva'
        });
      }
      
      res.json(reserva);
    } catch (error) {
      console.error('Error obteniendo reserva:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la reserva'
      });
    }
  },

  // Crear nueva reserva
  createReserva: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Datos de reserva inválidos',
          details: errors.array()
        });
      }

      const usuarioId = req.user.id;
      const { espacio, fechaReserva, horaInicio, horaFin, motivo, cantidadPersonas } = req.body;

      // Verificar que el espacio existe
      const espacioObj = await Espacio.findById(espacio);
      if (!espacioObj) {
        return res.status(404).json({
          error: 'Espacio no encontrado',
          message: 'El espacio seleccionado no existe'
        });
      }

      // Verificar que el espacio está disponible
      if (espacioObj.estado !== 'disponible') {
        return res.status(409).json({
          error: 'Espacio no disponible',
          message: `El espacio no está disponible para reservas (estado: ${espacioObj.estado})`
        });
      }

      // Verificar que la capacidad es suficiente
      if (cantidadPersonas > espacioObj.capacidad) {
        return res.status(409).json({
          error: 'Capacidad excedida',
          message: `La cantidad de personas (${cantidadPersonas}) excede la capacidad del espacio (${espacioObj.capacidad})`
        });
      }

      // Calcular duración
      const duracion = calcularDuracion(horaInicio, horaFin);

      // Verificar disponibilidad
      const estaDisponible = await Reserva.verificarDisponibilidad(
        espacio, 
        new Date(fechaReserva), 
        horaInicio, 
        horaFin
      );

      if (!estaDisponible) {
        return res.status(409).json({
          error: 'Horario no disponible',
          message: 'El espacio no está disponible en el horario seleccionado'
        });
      }

      // Crear reserva
      const reserva = new Reserva({
        usuario: usuarioId,
        espacio,
        fechaReserva: new Date(fechaReserva),
        horaInicio,
        horaFin,
        duracion,
        motivo,
        cantidadPersonas
      });

      await reserva.save();
      await reserva.populate('espacio', 'nombre ubicacion capacidad');

      // Enviar email de confirmación (opcional)
      try {
        await enviarEmailConfirmacion(reserva, req.user);
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        // No fallar la reserva por error de email
      }

      res.status(201).json({
        message: 'Reserva creada exitosamente',
        reserva
      });
    } catch (error) {
      console.error('Error creando reserva:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear la reserva'
      });
    }
  },

  // Actualizar reserva
  updateReserva: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Datos de reserva inválidos',
          details: errors.array()
        });
      }

      const reservaId = req.params.id;
      const usuarioId = req.user.id;
      const { espacio, fechaReserva, horaInicio, horaFin, motivo, cantidadPersonas } = req.body;

      // Buscar reserva existente
      const reservaExistente = await Reserva.findById(reservaId);
      if (!reservaExistente) {
        return res.status(404).json({
          error: 'Reserva no encontrada'
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && reservaExistente.usuario.toString() !== usuarioId) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'No tienes permiso para modificar esta reserva'
        });
      }

      // Verificar que se puede modificar
      if (!['pendiente', 'confirmada'].includes(reservaExistente.estado)) {
        return res.status(409).json({
          error: 'Reserva no modificable',
          message: 'Solo se pueden modificar reservas en estado pendiente o confirmada'
        });
      }

      // Verificar espacio si cambió
      const espacioId = espacio || reservaExistente.espacio.toString();
      const espacioObj = await Espacio.findById(espacioId);
      if (!espacioObj) {
        return res.status(404).json({
          error: 'Espacio no encontrado'
        });
      }

      // Verificar capacidad si cambió
      if (cantidadPersonas > espacioObj.capacidad) {
        return res.status(409).json({
          error: 'Capacidad excedida',
          message: `La cantidad de personas (${cantidadPersonas}) excede la capacidad del espacio (${espacioObj.capacidad})`
        });
      }

      // Calcular duración
      const duracion = calcularDuracion(horaInicio, horaFin);

      // Verificar disponibilidad (excluyendo la reserva actual)
      const fecha = new Date(fechaReserva || reservaExistente.fechaReserva);
      const horaInicioFinal = horaInicio || reservaExistente.horaInicio;
      const horaFinFinal = horaFin || reservaExistente.horaFin;

      const estaDisponible = await Reserva.verificarDisponibilidad(
        espacioId,
        fecha,
        horaInicioFinal,
        horaFinFinal,
        reservaId
      );

      if (!estaDisponible) {
        return res.status(409).json({
          error: 'Horario no disponible',
          message: 'El espacio no está disponible en el horario seleccionado'
        });
      }

      // Actualizar reserva
      const reservaActualizada = await Reserva.findByIdAndUpdate(
        reservaId,
        {
          espacio: espacioId,
          fechaReserva: fecha,
          horaInicio: horaInicioFinal,
          horaFin: horaFinFinal,
          duracion,
          motivo,
          cantidadPersonas
        },
        { new: true, runValidators: true }
      ).populate('espacio', 'nombre ubicacion capacidad');

      res.json({
        message: 'Reserva actualizada exitosamente',
        reserva: reservaActualizada
      });
    } catch (error) {
      console.error('Error actualizando reserva:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar la reserva'
      });
    }
  },

  // Cancelar reserva
  cancelReserva: async (req, res) => {
    try {
      const reservaId = req.params.id;
      const usuarioId = req.user.id;

      const reserva = await Reserva.findById(reservaId);
      if (!reserva) {
        return res.status(404).json({
          error: 'Reserva no encontrada'
        });
      }

      // Verificar permisos
      if (req.user.rol !== 'admin' && reserva.usuario.toString() !== usuarioId) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'No tienes permiso para cancelar esta reserva'
        });
      }

      // Verificar que se puede cancelar
      if (!['pendiente', 'confirmada'].includes(reserva.estado)) {
        return res.status(409).json({
          error: 'Reserva no cancelable',
          message: 'Solo se pueden cancelar reservas en estado pendiente o confirmada'
        });
      }

      // Cancelar reserva
      reserva.estado = 'cancelada';
      await reserva.save();

      res.json({
        message: 'Reserva cancelada exitosamente',
        reserva
      });
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo cancelar la reserva'
      });
    }
  },

  // Actualizar estado de reserva (admin)
  updateEstadoReserva: async (req, res) => {
    try {
      const { estado } = req.body;
      const reservaId = req.params.id;

      if (!['pendiente', 'confirmada', 'rechazada', 'completada'].includes(estado)) {
        return res.status(400).json({
          error: 'Estado inválido',
          message: 'Estado debe ser: pendiente, confirmada, rechazada o completada'
        });
      }

      const reserva = await Reserva.findByIdAndUpdate(
        reservaId,
        { estado },
        { new: true }
      ).populate('espacio', 'nombre').populate('usuario', 'nombre email');

      if (!reserva) {
        return res.status(404).json({
          error: 'Reserva no encontrada'
        });
      }

      res.json({
        message: `Estado de reserva actualizado a ${estado}`,
        reserva
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el estado de la reserva'
      });
    }
  },

  // Agregar notas del administrador
  addNotasAdministrador: async (req, res) => {
    try {
      const { notas } = req.body;
      const reservaId = req.params.id;

      const reserva = await Reserva.findByIdAndUpdate(
        reservaId,
        { notasAdministrador: notas },
        { new: true }
      );

      if (!reserva) {
        return res.status(404).json({
          error: 'Reserva no encontrada'
        });
      }

      res.json({
        message: 'Notas agregadas exitosamente',
        reserva
      });
    } catch (error) {
      console.error('Error agregando notas:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron agregar las notas'
      });
    }
  }
};

// Función auxiliar para calcular duración en minutos
function calcularDuracion(horaInicio, horaFin) {
  const [hInicio, mInicio] = horaInicio.split(':').map(Number);
  const [hFin, mFin] = horaFin.split(':').map(Number);
  
  const minutosInicio = hInicio * 60 + mInicio;
  const minutosFin = hFin * 60 + mFin;
  
  return minutosFin - minutosInicio;
}

// Función para enviar email de confirmación
async function enviarEmailConfirmacion(reserva, usuario) {
  // Configurar transporter (usando Gmail como ejemplo)
  const transporter = nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: usuario.email,
    subject: 'Confirmación de Reserva - Bahía Hub',
    html: `
      <h2>¡Reserva Confirmada!</h2>
      <p>Hola ${usuario.nombre},</p>
      <p>Tu reserva ha sido creada exitosamente. Aquí los detalles:</p>
      <ul>
        <li><strong>Espacio:</strong> ${reserva.espacio.nombre}</li>
        <li><strong>Fecha:</strong> ${reserva.fechaReserva.toLocaleDateString()}</li>
        <li><strong>Horario:</strong> ${reserva.horaInicio} - ${reserva.horaFin}</li>
        <li><strong>Motivo:</strong> ${reserva.motivo}</li>
        <li><strong>Personas:</strong> ${reserva.cantidadPersonas}</li>
      </ul>
      <p>Estado: <strong>${reserva.estado}</strong></p>
      <p>¡Te esperamos en Bahía Hub!</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = reservaController;