// backend/src/services/qr.service.js
const QRCode = require('qrcode');

/**
 * Retorna la URL pública de verificación y la imagen QR en formato Data URL (base64)
 */
const generateVerificationQR = async (tokenSha256) => {
  const baseUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';
  const verificationUrl = `${baseUrl}/verificar/${tokenSha256}`;

  const qrImageDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 1,
    width: 250,
    color: {
      dark: '#0f172a', // Color oscuro formal
      light: '#ffffff',
    },
  });

  return {
    verificationUrl,
    qrImageDataUrl,
  };
};

module.exports = {
  generateVerificationQR,
};