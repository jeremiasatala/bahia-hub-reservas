const express = require('express');
const { body } = require('express-validator');
const reservaController = require('../controllers/reservaController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones
const reservaValidation = [
  body('espacio')
    .isMongoId()
    .withMessage('ID de espacio inválido'),
  body('fechaReserva')
    .isISO8601()
    .withMessage('Fecha de reserva inválida'),
  body('horaInicio')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de inicio inválida (formato HH:MM)'),
  body('horaFin')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de fin inválida (formato HH:MM)'),
  body('motivo')
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage('El motivo debe tener entre 5 y 300 caracteres'),
  body('cantidadPersonas')
    .isInt({ min: 1 })
    .withMessage('La cantidad de personas debe ser al menos 1')
];

// Rutas protegidas
router.get('/', authMiddleware, reservaController.getReservas);
router.get('/usuario', authMiddleware, reservaController.getReservasUsuario);
router.get('/:id', authMiddleware, reservaController.getReservaById);
router.post('/', authMiddleware, reservaValidation, reservaController.createReserva);
router.put('/:id', authMiddleware, reservaValidation, reservaController.updateReserva);
router.delete('/:id', authMiddleware, reservaController.cancelReserva);

// Rutas de administrador
router.get('/admin/todas', authMiddleware, adminMiddleware, reservaController.getAllReservas);
router.patch('/:id/estado', authMiddleware, adminMiddleware, reservaController.updateEstadoReserva);
router.put('/:id/notas', authMiddleware, adminMiddleware, reservaController.addNotasAdministrador);

module.exports = router;