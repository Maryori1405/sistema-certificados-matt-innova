// backend/src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso no autorizado: Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_matt_innova_2026');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Sesión caducada o token inválido.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.tipo_usuario === 'Administrador') {
    next();
  } else {
    return res.status(403).json({ message: 'Permiso denegado: Se requiere perfil de Administrador.' });
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
};