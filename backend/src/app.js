const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tu-frontend.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana
});
app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Middleware de API Key
const apiKeyMiddleware = require('./middleware/apiKeyMiddleware');
app.use(apiKeyMiddleware);

// Rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const espacioRoutes = require('./routes/espacios');
const reservaRoutes = require('./routes/reservas');
const reporteRoutes = require('./routes/reportes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/espacios', espacioRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/reportes', reporteRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Bahía Hub API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en este servidor`
  });
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Error interno del servidor'
  });
});

if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const __dirname = path.resolve();
  
  // Servir archivos estáticos de React build
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Para cualquier ruta no manejada por la API, servir React
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV}`);
});

module.exports = app;