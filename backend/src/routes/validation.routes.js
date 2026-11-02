// backend/src/routes/validation.routes.js
const express = require('express');
const router = express.Router();
const { verifyByToken, getCertificatesByDni } = require('../controllers/validation.controller');

// Consulta por DNI desde el portal del estudiante
router.get('/portal/:dni', getCertificatesByDni);

// Consulta por Token QR
router.get('/:token', verifyByToken);

module.exports = router;