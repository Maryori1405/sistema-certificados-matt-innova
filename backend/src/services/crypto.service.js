// backend/src/services/crypto.service.js
const crypto = require('crypto');

/**
 * Genera un token hash SHA-256 criptográficamente seguro
 * combinando el código del certificado, DNI, fecha y una sal interna.
 */
const generateCertificateHash = (codigoOficial, dni, fechaEmision) => {
  const secretPepper = process.env.TOKEN_SECRET_PEPPER || 'matt_innova_secure_token_key_2026';
  const rawData = `${codigoOficial}|${dni}|${fechaEmision}|${secretPepper}|${Date.now()}`;
  return crypto.createHash('sha256').update(rawData).digest('hex');
};

module.exports = {
  generateCertificateHash,
};