const express = require('express');
const { body } = require('express-validator');
const espacioController = require('../controllers/espacioController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones
const espacioValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('tipo')
    .isIn(['sala_reuniones', 'aula', 'auditorio', 'oficina', 'coworking'])
    .withMessage('Tipo de espacio inválido'),
  body('ubicacion')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('La ubicación debe tener entre 2 y 200 caracteres'),
  body('capacidad')
    .isInt({ min: 1 })
    .withMessage('La capacidad debe ser un número mayor a 0')
];

// Rutas públicas
router.get('/', espacioController.getEspacios);
router.get('/:id', espacioController.getEspacioById);
router.get('/:id/disponibilidad', espacioController.getDisponibilidad);

// Rutas protegidas (admin)
router.post('/', authMiddleware, adminMiddleware, espacioValidation, espacioController.createEspacio);
router.put('/:id', authMiddleware, adminMiddleware, espacioValidation, espacioController.updateEspacio);
router.delete('/:id', authMiddleware, adminMiddleware, espacioController.deleteEspacio);
router.patch('/:id/estado', authMiddleware, adminMiddleware, espacioController.updateEstado);

module.exports = router;