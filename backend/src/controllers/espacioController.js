const Espacio = require('../models/Espacio');
const Reserva = require('../models/Reserva');
const { validationResult } = require('express-validator');

const espacioController = {
  // Obtener todos los espacios
  getEspacios: async (req, res) => {
    try {
      const { tipo, estado, search, page = 1, limit = 10 } = req.query;
      
      let query = {};
      
      // Filtros
      if (tipo) query.tipo = tipo;
      if (estado) query.estado = estado;
      if (search) {
        query.$text = { $search: search };
      }
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { nombre: 1 }
      };
      
      // Usando paginación simple (podría mejorarse con mongoose-paginate-v2)
      const skip = (options.page - 1) * options.limit;
      const espacios = await Espacio.find(query)
        .skip(skip)
        .limit(options.limit)
        .sort(options.sort);
      
      const total = await Espacio.countDocuments(query);
      
      res.json({
        espacios,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      console.error('Error obteniendo espacios:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los espacios'
      });
    }
  },

  // Obtener espacio por ID
  getEspacioById: async (req, res) => {
    try {
      const espacio = await Espacio.findById(req.params.id);
      
      if (!espacio) {
        return res.status(404).json({
          error: 'Espacio no encontrado',
          message: 'El espacio solicitado no existe'
        });
      }
      
      res.json(espacio);
    } catch (error) {
      console.error('Error obteniendo espacio:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el espacio'
      });
    }
  },

  // Crear nuevo espacio
  createEspacio: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Datos del espacio inválidos',
          details: errors.array()
        });
      }

      const espacio = new Espacio(req.body);
      await espacio.save();

      res.status(201).json({
        message: 'Espacio creado exitosamente',
        espacio
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          error: 'Espacio duplicado',
          message: 'Ya existe un espacio con ese nombre'
        });
      }
      
      console.error('Error creando espacio:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear el espacio'
      });
    }
  },

  // Actualizar espacio
  updateEspacio: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Datos del espacio inválidos',
          details: errors.array()
        });
      }

      const espacio = await Espacio.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!espacio) {
        return res.status(404).json({
          error: 'Espacio no encontrado',
          message: 'El espacio que intentas actualizar no existe'
        });
      }

      res.json({
        message: 'Espacio actualizado exitosamente',
        espacio
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          error: 'Espacio duplicado',
          message: 'Ya existe un espacio con ese nombre'
        });
      }
      
      console.error('Error actualizando espacio:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el espacio'
      });
    }
  },

  // Eliminar espacio
  deleteEspacio: async (req, res) => {
    try {
      const espacio = await Espacio.findById(req.params.id);
      
      if (!espacio) {
        return res.status(404).json({
          error: 'Espacio no encontrado',
          message: 'El espacio que intentas eliminar no existe'
        });
      }

      // Verificar si hay reservas futuras para este espacio
      const reservasFuturas = await Reserva.findOne({
        espacio: req.params.id,
        fechaReserva: { $gte: new Date() },
        estado: { $in: ['pendiente', 'confirmada'] }
      });

      if (reservasFuturas) {
        return res.status(409).json({
          error: 'No se puede eliminar el espacio',
          message: 'Existen reservas futuras para este espacio. Cancélalas primero.'
        });
      }

      await Espacio.findByIdAndDelete(req.params.id);

      res.json({
        message: 'Espacio eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando espacio:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el espacio'
      });
    }
  },

  // Actualizar estado del espacio
  updateEstado: async (req, res) => {
    try {
      const { estado } = req.body;
      
      if (!['disponible', 'mantenimiento', 'no_disponible'].includes(estado)) {
        return res.status(400).json({
          error: 'Estado inválido',
          message: 'El estado debe ser: disponible, mantenimiento o no_disponible'
        });
      }

      const espacio = await Espacio.findByIdAndUpdate(
        req.params.id,
        { estado },
        { new: true }
      );

      if (!espacio) {
        return res.status(404).json({
          error: 'Espacio no encontrado'
        });
      }

      res.json({
        message: `Estado del espacio actualizado a ${estado}`,
        espacio
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el estado del espacio'
      });
    }
  },

  // Obtener disponibilidad de un espacio
  getDisponibilidad: async (req, res) => {
    try {
      const { fecha } = req.query;
      const espacioId = req.params.id;
      
      if (!fecha) {
        return res.status(400).json({
          error: 'Fecha requerida',
          message: 'Debe proporcionar una fecha para consultar la disponibilidad'
        });
      }

      const fechaConsulta = new Date(fecha);
      if (isNaN(fechaConsulta.getTime())) {
        return res.status(400).json({
          error: 'Fecha inválida',
          message: 'La fecha proporcionada no es válida'
        });
      }

      // Obtener el espacio
      const espacio = await Espacio.findById(espacioId);
      if (!espacio) {
        return res.status(404).json({
          error: 'Espacio no encontrado'
        });
      }

      // Obtener reservas para esa fecha
      const reservas = await Reserva.find({
        espacio: espacioId,
        fechaReserva: fechaConsulta,
        estado: { $in: ['pendiente', 'confirmada'] }
      }).select('horaInicio horaFin estado');

      // Generar horarios disponibles (simplificado)
      const horariosDisponibles = generarHorariosDisponibles(espacio, reservas);

      res.json({
        espacio: espacio.nombre,
        fecha: fechaConsulta.toISOString().split('T')[0],
        horariosDisponibles,
        reservasExistentes: reservas
      });
    } catch (error) {
      console.error('Error obteniendo disponibilidad:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la disponibilidad'
      });
    }
  }
};

// Función auxiliar para generar horarios disponibles
function generarHorariosDisponibles(espacio, reservas) {
  const horarios = [];
  const horaInicio = parseInt(espacio.horariosDisponibles.horaInicio.split(':')[0]);
  const horaFin = parseInt(espacio.horariosDisponibles.horaFin.split(':')[0]);
  
  // Simplificación: generar horarios cada hora
  for (let hora = horaInicio; hora < horaFin; hora++) {
    const horarioStr = `${hora.toString().padStart(2, '0')}:00`;
    const estaOcupado = reservas.some(reserva => 
      reserva.horaInicio <= horarioStr && reserva.horaFin > horarioStr
    );
    
    if (!estaOcupado) {
      horarios.push(horarioStr);
    }
  }
  
  return horarios;
}

module.exports = espacioController;