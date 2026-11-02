// backend/src/controllers/validation.controller.js
const db = require('../config/db');

// 1. Validar por Token SHA-256 o Código Oficial
const verifyByToken = async (req, res) => {
  const { token } = req.params;

  if (!token || token === 'undefined') {
    return res.status(400).json({ 
      valido: false, 
      message: 'Token de validación no proporcionado.' 
    });
  }

  try {
    const query = `
      SELECT c.id, c.codigo_oficial, c.modalidad, c.total_horas, c.fecha_emision, 
             c.estado, c.motivo_revocacion, c.token_sha256,
             u.dni, CONCAT(u.nombres, ' ', u.apellidos) AS titular
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.token_sha256 = $1 OR c.codigo_oficial = $1;
    `;
    const result = await db.query(query, [token.trim()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        valido: false, 
        message: 'Certificado no registrado o token alterado.' 
      });
    }

    const cert = result.rows[0];

    // Registro de auditoría protegido
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Desconocido';
      await db.query(
        'INSERT INTO auditoria_consultas_qr (certificado_id, ip_origen, user_agent) VALUES ($1, $2, $3)',
        [cert.id, ip, userAgent]
      );
    } catch (auditErr) {
      // Si la tabla de auditoría no existe o falla, no interrumpe la respuesta
      console.warn('Aviso de auditoría:', auditErr.message);
    }

    return res.json({
      valido: cert.estado === 'Vigente',
      certificado: cert,
    });
  } catch (error) {
    console.error('Error en verifyByToken:', error);
    return res.status(500).json({ message: 'Error interno al procesar la validación.' });
  }
};

// 2. Consultar certificados por DNI desde el Portal del Practicante
const getCertificatesByDni = async (req, res) => {
  const { dni } = req.params;

  if (!dni || dni.trim().length !== 8) {
    return res.status(400).json({ message: 'El DNI debe tener 8 dígitos válidos.' });
  }

  try {
    const userQuery = `
      SELECT id, dni, nombres, apellidos, tipo_usuario, area_asignada, estado
      FROM usuarios
      WHERE dni = $1;
    `;
    const userResult = await db.query(userQuery, [dni.trim()]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró ningún registro con ese DNI.' });
    }

    const usuario = userResult.rows[0];

    const certQuery = `
      SELECT id, codigo_oficial, modalidad, total_horas, fecha_emision, token_sha256, estado
      FROM certificados
      WHERE usuario_id = $1
      ORDER BY id DESC;
    `;
    const certResult = await db.query(certQuery, [usuario.id]);

    return res.json({
      user: usuario,
      certificates: certResult.rows,
    });
  } catch (error) {
    console.error('Error en getCertificatesByDni:', error);
    return res.status(500).json({ message: 'Error al consultar certificados por DNI.' });
  }
};

module.exports = {
  verifyByToken,
  getCertificatesByDni,
};