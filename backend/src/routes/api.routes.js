// backend/src/routes/api.routes.js
const express = require('express');
const router = express.Router();

const { login } = require('../controllers/auth.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { 
  issueCertificate, 
  listCertificates, 
  revokeCertificate, 
  downloadCertificatePdf,
  getDashboardStats 
} = require('../controllers/certificate.controller');
const { 
  verifyByToken, 
  getCertificatesByDni 
} = require('../controllers/validation.controller');
const { 
  listUsers, 
  createUser, 
  updateUser 
} = require('../controllers/user.controller');

// ==========================================
// 1. RUTAS PÚBLICAS (Sin token JWT)
// ==========================================

// Autenticación administrativa
router.post('/auth/login', login);

// Consulta pública de constancias por DNI (Portal del Practicante)
router.get('/public/verify/portal/:dni', getCertificatesByDni);

// Verificación pública externa mediante QR / Token SHA-256
router.get('/public/verify/:token', verifyByToken);

// Descarga directa de respaldo PDF
router.get('/certificates/:id/download', downloadCertificatePdf);


// ==========================================
// 2. RUTAS PROTEGIDAS (Solo Administrador)
// ==========================================

// Métricas consolidadas del Dashboard (incluye token_sha256 de filas recientes)
router.get('/admin/dashboard-stats', verifyToken, requireAdmin, getDashboardStats);

// Gestión y emisión de certificados
router.post('/certificates/issue', verifyToken, requireAdmin, issueCertificate);
router.get('/certificates', verifyToken, requireAdmin, listCertificates);
router.put('/certificates/:id/revoke', verifyToken, requireAdmin, revokeCertificate);

// Directorio de Practicantes y Colaboradores en PostgreSQL
router.get('/users', verifyToken, requireAdmin, listUsers);
router.post('/users', verifyToken, requireAdmin, createUser);

// Actualización de datos y DNI (se registran ambas variantes para prevenir fallas de prefijo)
router.put('/users/:id', verifyToken, requireAdmin, updateUser);
router.put('/admin/users/:id', verifyToken, requireAdmin, updateUser);

module.exports = router;