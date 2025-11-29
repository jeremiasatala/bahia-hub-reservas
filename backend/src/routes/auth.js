const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones
const registerValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('telefono')
    .optional()
    .isMobilePhone()
    .withMessage('Debe proporcionar un número de teléfono válido')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

// Rutas públicas
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Rutas protegidas
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, changePasswordValidation, authController.changePassword);

module.exports = router;