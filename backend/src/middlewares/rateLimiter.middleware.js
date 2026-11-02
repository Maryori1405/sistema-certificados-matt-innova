// backend/src/middlewares/rateLimiter.middleware.js
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  // Middleware neutro en caso de no instalar la dependencia opcional
  rateLimit = () => (req, res, next) => next();
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos fallidos. Por seguridad, intente en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const qrVerificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { message: 'Límite de consultas QR alcanzado temporalmente.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  qrVerificationLimiter,
};