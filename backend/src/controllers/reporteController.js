const Reserva = require('../models/Reserva');
const Espacio = require('../models/Espacio');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const reporteController = {
  // Reporte de uso de espacios
  getReporteUsoEspacios: async (req, res) => {
    try {
      const { fechaInicio, fechaFin, tipo } = req.query;
      
      let matchStage = {};
      
      // Filtros de fecha
      if (fechaInicio || fechaFin) {
        matchStage.fechaReserva = {};
        if (fechaInicio) matchStage.fechaReserva.$gte = new Date(fechaInicio);
        if (fechaFin) matchStage.fechaReserva.$lte = new Date(fechaFin);
      }
      
      // Filtro por tipo de espacio
      if (tipo) {
        const espacios = await Espacio.find({ tipo }).select('_id');
        matchStage.espacio = { $in: espacios.map(e => e._id) };
      }
      
      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'espacios',
            localField: 'espacio',
            foreignField: '_id',
            as: 'espacioInfo'
          }
        },
        { $unwind: '$espacioInfo' },
        {
          $group: {
            _id: '$espacioInfo._id',
            nombre: { $first: '$espacioInfo.nombre' },
            tipo: { $first: '$espacioInfo.tipo' },
            totalReservas: { $sum: 1 },
            horasUtilizadas: { $sum: '$duracion' },
            promedioPersonas: { $avg: '$cantidadPersonas' }
          }
        },
        { $sort: { totalReservas: -1 } }
      ];
      
      const reporte = await Reserva.aggregate(pipeline);
      
      res.json({
        fechaGeneracion: new Date(),
        parametros: { fechaInicio, fechaFin, tipo },
        totalEspacios: reporte.length,
        reporte
      });
    } catch (error) {
      console.error('Error generando reporte:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo generar el reporte'
      });
    }
  },

  // Reporte de reservas
  getReporteReservas: async (req, res) => {
    try {
      const { fechaInicio, fechaFin, estado, espacio } = req.query;
      
      let query = {};
      
      // Filtros
      if (fechaInicio || fechaFin) {
        query.fechaReserva = {};
        if (fechaInicio) query.fechaReserva.$gte = new Date(fechaInicio);
        if (fechaFin) query.fechaReserva.$lte = new Date(fechaFin);
      }
      
      if (estado) query.estado = estado;
      if (espacio) query.espacio = espacio;
      
      const reservas = await Reserva.find(query)
        .populate('espacio', 'nombre tipo ubicacion')
        .populate('usuario', 'nombre email')
        .sort({ fechaReserva: -1, horaInicio: -1 });
      
      // Estadísticas
      const estadisticas = {
        total: reservas.length,
        porEstado: {},
        porTipoEspacio: {}
      };
      
      reservas.forEach(reserva => {
        // Conteo por estado
        estadisticas.porEstado[reserva.estado] = (estadisticas.porEstado[reserva.estado] || 0) + 1;
        
        // Conteo por tipo de espacio
        if (reserva.espacio) {
          const tipo = reserva.espacio.tipo;
          estadisticas.porTipoEspacio[tipo] = (estadisticas.porTipoEspacio[tipo] || 0) + 1;
        }
      });
      
      res.json({
        fechaGeneracion: new Date(),
        parametros: { fechaInicio, fechaFin, estado, espacio },
        estadisticas,
        reservas
      });
    } catch (error) {
      console.error('Error generando reporte:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo generar el reporte'
      });
    }
  },

  // Reporte de usuarios
  getReporteUsuarios: async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      
      let matchStage = {};
      
      if (fechaInicio || fechaFin) {
        matchStage.fechaReserva = {};
        if (fechaInicio) matchStage.fechaReserva.$gte = new Date(fechaInicio);
        if (fechaFin) matchStage.fechaReserva.$lte = new Date(fechaFin);
      }
      
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$usuario',
            totalReservas: { $sum: 1 },
            totalHoras: { $sum: '$duracion' },
            primeraReserva: { $min: '$fechaReserva' },
            ultimaReserva: { $max: '$fechaReserva' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'usuarioInfo'
          }
        },
        { $unwind: '$usuarioInfo' },
        {
          $project: {
            usuario: '$usuarioInfo.nombre',
            email: '$usuarioInfo.email',
            totalReservas: 1,
            totalHoras: 1,
            primeraReserva: 1,
            ultimaReserva: 1
          }
        },
        { $sort: { totalReservas: -1 } }
      ];
      
      const reporte = await Reserva.aggregate(pipeline);
      
      res.json({
        fechaGeneracion: new Date(),
        parametros: { fechaInicio, fechaFin },
        totalUsuarios: reporte.length,
        reporte
      });
    } catch (error) {
      console.error('Error generando reporte:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo generar el reporte'
      });
    }
  },

  // Generar reporte en PDF
  generarReportePDF: async (req, res) => {
    try {
      const { tipo, parametros } = req.body;
      
      let datos;
      let titulo;
      
      // Obtener datos según el tipo de reporte
      switch (tipo) {
        case 'uso-espacios':
          titulo = 'Reporte de Uso de Espacios';
          const usoResponse = await reporteController.getReporteUsoEspaciosData(parametros);
          datos = usoResponse;
          break;
        case 'reservas':
          titulo = 'Reporte de Reservas';
          const reservasResponse = await reporteController.getReporteReservasData(parametros);
          datos = reservasResponse;
          break;
        case 'usuarios':
          titulo = 'Reporte de Usuarios';
          const usuariosResponse = await reporteController.getReporteUsuariosData(parametros);
          datos = usuariosResponse;
          break;
        default:
          return res.status(400).json({
            error: 'Tipo de reporte inválido'
          });
      }
      
      // Crear documento PDF
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-${tipo}-${Date.now()}.pdf"`);
      
      doc.pipe(res);
      
      // Encabezado
      doc.fontSize(20).text(titulo, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generado el: ${new Date().toLocaleString()}`);
      doc.moveDown();
      
      // Contenido según el tipo de reporte
      switch (tipo) {
        case 'uso-espacios':
          generarPDFUsoEspacios(doc, datos);
          break;
        case 'reservas':
          generarPDFReservas(doc, datos);
          break;
        case 'usuarios':
          generarPDFUsuarios(doc, datos);
          break;
      }
      
      doc.end();
    } catch (error) {
      console.error('Error generando PDF:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo generar el reporte PDF'
      });
    }
  },

  // Generar reporte en Excel
  generarReporteExcel: async (req, res) => {
    try {
      const { tipo, parametros } = req.body;
      
      let datos;
      let titulo;
      
      // Obtener datos según el tipo de reporte
      switch (tipo) {
        case 'uso-espacios':
          titulo = 'Reporte de Uso de Espacios';
          const usoResponse = await reporteController.getReporteUsoEspaciosData(parametros);
          datos = usoResponse;
          break;
        case 'reservas':
          titulo = 'Reporte de Reservas';
          const reservasResponse = await reporteController.getReporteReservasData(parametros);
          datos = reservasResponse;
          break;
        case 'usuarios':
          titulo = 'Reporte de Usuarios';
          const usuariosResponse = await reporteController.getReporteUsuariosData(parametros);
          datos = usuariosResponse;
          break;
        default:
          return res.status(400).json({
            error: 'Tipo de reporte inválido'
          });
      }
      
      // Crear workbook de Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(titulo);
      
      // Generar contenido según el tipo
      switch (tipo) {
        case 'uso-espacios':
          await generarExcelUsoEspacios(worksheet, datos);
          break;
        case 'reservas':
          await generarExcelReservas(worksheet, datos);
          break;
        case 'usuarios':
          await generarExcelUsuarios(worksheet, datos);
          break;
      }
      
      // Configurar respuesta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-${tipo}-${Date.now()}.xlsx"`);
      
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error generando Excel:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo generar el reporte Excel'
      });
    }
  },

  // Funciones auxiliares para obtener datos
  getReporteUsoEspaciosData: async (parametros) => {
    // Implementación similar a getReporteUsoEspacios pero retorna datos
    return { /* datos del reporte */ };
  },
  
  getReporteReservasData: async (parametros) => {
    // Implementación similar a getReporteReservas pero retorna datos
    return { /* datos del reporte */ };
  },
  
  getReporteUsuariosData: async (parametros) => {
    // Implementación similar a getReporteUsuarios pero retorna datos
    return { /* datos del reporte */ };
  }
};

// Funciones auxiliares para generación de PDF
function generarPDFUsoEspacios(doc, datos) {
  doc.text('Resumen de Uso de Espacios:');
  datos.reporte.forEach((espacio, index) => {
    doc.moveDown(0.5);
    doc.text(`${index + 1}. ${espacio.nombre} (${espacio.tipo})`);
    doc.text(`   Total reservas: ${espacio.totalReservas}`);
    doc.text(`   Horas utilizadas: ${(espacio.horasUtilizadas / 60).toFixed(1)} horas`);
    doc.text(`   Promedio personas: ${espacio.promedioPersonas.toFixed(1)}`);
  });
}

function generarPDFReservas(doc, datos) {
  doc.text(`Total reservas: ${datos.estadisticas.total}`);
  doc.moveDown();
  doc.text('Distribución por estado:');
  Object.entries(datos.estadisticas.porEstado).forEach(([estado, count]) => {
    doc.text(`   ${estado}: ${count}`);
  });
}

function generarPDFUsuarios(doc, datos) {
  doc.text(`Total usuarios activos: ${datos.totalUsuarios}`);
  datos.reporte.forEach((usuario, index) => {
    doc.moveDown(0.5);
    doc.text(`${index + 1}. ${usuario.usuario} (${usuario.email})`);
    doc.text(`   Total reservas: ${usuario.totalReservas}`);
    doc.text(`   Total horas: ${(usuario.totalHoras / 60).toFixed(1)}`);
  });
}

// Funciones auxiliares para generación de Excel
async function generarExcelUsoEspacios(worksheet, datos) {
  worksheet.columns = [
    { header: 'Espacio', key: 'nombre', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 15 },
    { header: 'Total Reservas', key: 'totalReservas', width: 15 },
    { header: 'Horas Utilizadas', key: 'horasUtilizadas', width: 15 },
    { header: 'Promedio Personas', key: 'promedioPersonas', width: 15 }
  ];
  
  datos.reporte.forEach(espacio => {
    worksheet.addRow({
      nombre: espacio.nombre,
      tipo: espacio.tipo,
      totalReservas: espacio.totalReservas,
      horasUtilizadas: (espacio.horasUtilizadas / 60).toFixed(1),
      promedioPersonas: espacio.promedioPersonas.toFixed(1)
    });
  });
}

async function generarExcelReservas(worksheet, datos) {
  // Implementación similar para reservas
}

async function generarExcelUsuarios(worksheet, datos) {
  // Implementación similar para usuarios
}

module.exports = reporteController;