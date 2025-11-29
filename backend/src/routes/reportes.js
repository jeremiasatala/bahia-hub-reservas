const express = require('express');
const reporteController = require('../controllers/reporteController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas protegidas (admin)
router.get('/uso-espacios', authMiddleware, adminMiddleware, reporteController.getReporteUsoEspacios);
router.get('/reservas', authMiddleware, adminMiddleware, reporteController.getReporteReservas);
router.get('/usuarios', authMiddleware, adminMiddleware, reporteController.getReporteUsuarios);
router.post('/generar-pdf', authMiddleware, adminMiddleware, reporteController.generarReportePDF);
router.post('/generar-excel', authMiddleware, adminMiddleware, reporteController.generarReporteExcel);

module.exports = router;s