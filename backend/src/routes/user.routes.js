// backend/src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const { listUsers, createUser, updateUser } = require('../controllers/user.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

// GET /api/users
router.get('/', verifyToken, requireAdmin, listUsers);

// POST /api/users
router.post('/', verifyToken, requireAdmin, createUser);

// PUT /api/users/:id  <--- AQUÍ ESTABA EL FALTANTE
router.put('/:id', verifyToken, requireAdmin, updateUser);

module.exports = router;