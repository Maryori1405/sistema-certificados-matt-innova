// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

const { 
  login, 
  getSecurityQuestion, 
  resetPasswordWithSecurityAnswer 
} = require('../controllers/auth.controller');

// 1. Inicio de sesión
router.post('/login', login);

// 2. Consulta de la pregunta de seguridad por DNI o correo
router.post('/recuperar/pregunta', getSecurityQuestion);

// 3. Validación de respuesta secreta y cambio de contraseña
router.post('/recuperar/cambiar-password', resetPasswordWithSecurityAnswer);

module.exports = router;