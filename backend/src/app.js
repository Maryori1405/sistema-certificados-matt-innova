// backend/src/app.js
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const certificateRoutes = require('./routes/certificates.routes');
const validationRoutes = require('./routes/validation.routes');
const { getDashboardStats } = require('./controllers/stats.controller');
const { verifyToken, requireAdmin } = require('./middlewares/auth.middleware');

const app = express();

// Configuración de CORS y parseo de peticiones
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Ruta base de estado y bienvenida
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    sistema: 'API de Certificados Digitales - Matt Innova Solution E.I.R.L.',
    estado: 'Servidor backend activo y operativo',
    ambiente: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// Montaje de rutas modulares
// ==========================================

// Autenticación y recuperación de contraseñas
app.use('/api/auth', authRoutes);

// Directorio de usuarios y colaboradores (GET, POST, PUT)
app.use('/api/users', userRoutes);

// Gestión y emisión de certificados
app.use('/api/certificates', certificateRoutes);

// Verificación pública y consultas QR
app.use('/api/public/verify', validationRoutes);

// Métricas de Dashboard (Ruta administrativa protegida)
app.get('/api/admin/dashboard-stats', verifyToken, requireAdmin, getDashboardStats);

// Manejador global para rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada en el sistema.' });
});

module.exports = app;