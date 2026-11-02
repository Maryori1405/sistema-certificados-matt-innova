// backend/src/controllers/certificates.controller.js
const crypto = require('crypto');
const QRCode = require('qrcode');
const pool = require('../database'); // Conexión a Neon PostgreSQL
const { generateCertificatePdfBuffer } = require('../services/pdf.service');

// URL base oficial del Frontend en Vercel
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sistema-certificados-matt-innova.vercel.app';

/**
 * 1. Listar certificados con filtros opcionales
 */
const getCertificates = async (req, res) => {
  try {
    const { estado } = req.query;
    let query = `
      SELECT 
        c.id, 
        c.codigo_oficial, 
        CONCAT(u.nombres, ' ', u.apellidos) AS titular, 
        u.dni,
        u.area_asignada,
        c.modalidad, 
        c.total_horas, 
        c.fecha_emision, 
        c.token_sha256, 
        c.estado, 
        c.motivo_revocacion
      FROM certificados c
      INNER JOIN usuarios u ON c.usuario_id = u.id
    `;
    const params = [];

    if (estado && estado !== 'Todos') {
      query += ` WHERE c.estado = $1`;
      params.push(estado);
    }

    query += ` ORDER BY c.id DESC`;

    const result = await pool.query(query, params);
    return res.status(200).json({ certificates: result.rows });
  } catch (error) {
    console.error('Error al obtener certificados:', error);
    return res.status(500).json({ message: 'Error interno al consultar certificados.' });
  }
};

/**
 * 2. Emitir un nuevo certificado digital con Token SHA-256
 */
const issueCertificate = async (req, res) => {
  try {
    const { usuario_id, modalidad, total_horas, fecha_emision, plantilla_modelo, desempeno_detalle } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ message: 'El usuario_id es obligatorio.' });
    }

    // Obtener datos del usuario
    const userRes = await pool.query('SELECT * FROM usuarios WHERE id = $1', [usuario_id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'Colaborador no encontrado.' });
    }
    const user = userRes.rows[0];

    // Generar código correlativo (ej. CERT-2026-006)
    const countRes = await pool.query('SELECT COUNT(*) FROM certificados');
    const nextNumber = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(3, '0');
    const codigoOficial = `CERT-2026-${nextNumber}`;

    // Generar Token SHA-256 único e inmutable
    const payload = `${codigoOficial}-${user.dni}-${Date.now()}`;
    const tokenSha256 = crypto.createHash('sha256').update(payload).digest('hex');

    // Registrar en la base de datos
    const insertQuery = `
      INSERT INTO certificados (
        usuario_id, codigo_oficial, modalidad, total_horas, fecha_emision, 
        token_sha256, estado, plantilla_modelo, desempeno_detalle
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Vigente', $7, $8)
      RETURNING *
    `;
    const values = [
      usuario_id,
      codigoOficial,
      modalidad || 'Prácticas Preprofesionales',
      total_horas || 480,
      fecha_emision || new Date(),
      tokenSha256,
      plantilla_modelo || 'Plantilla Formal Elite',
      desempeno_detalle || ''
    ];

    const newCert = await pool.query(insertQuery, values);

    return res.status(201).json({
      message: 'Certificado emitido con éxito.',
      certificate: newCert.rows[0]
    });
  } catch (error) {
    console.error('Error al emitir certificado:', error);
    return res.status(500).json({ message: 'Error interno al registrar el certificado.' });
  }
};

/**
 * 3. Descargar Certificado en PDF Vectorial con QR a Vercel
 */
const downloadCertificatePdf = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        c.id, 
        c.codigo_oficial, 
        CONCAT(u.nombres, ' ', u.apellidos) AS "nombreCompleto", 
        u.dni,
        u.area_asignada,
        c.modalidad, 
        c.total_horas, 
        c.fecha_emision, 
        c.token_sha256, 
        c.estado
      FROM certificados c
      INNER JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Certificado no encontrado en el sistema.' });
    }

    const cert = result.rows[0];

    // Enmascarar DNI (Ley 29733)
    const dniStr = String(cert.dni || '');
    const dniEnmascarado = dniStr.length >= 5 
      ? `${dniStr.substring(0, 2)}***${dniStr.substring(dniStr.length - 3)}`
      : dniStr;

    // Generar URL pública apuntando a Vercel para el código QR
    const qrUrl = `${FRONTEND_URL}/verificar/${cert.token_sha256 || cert.codigo_oficial}`;
    
    // Generar buffer en base64 del código QR
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 250,
      color: {
        dark: '#0A1931',
        light: '#FFFFFF',
      }
    });

    const pdfData = {
      ...cert,
      dniEnmascarado,
      fecha_emision: cert.fecha_emision 
        ? new Date(cert.fecha_emision).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
    };

    // Generar el binario con el diseño Monumental Formal Elite
    const pdfBuffer = await generateCertificatePdfBuffer(pdfData, qrDataUrl);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificado_${cert.codigo_oficial}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF del certificado:', error);
    return res.status(500).json({ message: 'Error interno al procesar el documento PDF.' });
  }
};

/**
 * 4. Revocar o Anular Certificado
 */
const revokeCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({ message: 'Debe especificar el motivo formal de revocación.' });
    }

    const updateQuery = `
      UPDATE certificados 
      SET estado = 'Revocado', motivo_revocacion = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [motivo, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Certificado no encontrado.' });
    }

    return res.status(200).json({
      message: 'Certificado revocado exitosamente.',
      certificate: result.rows[0]
    });
  } catch (error) {
    console.error('Error al revocar certificado:', error);
    return res.status(500).json({ message: 'Error interno al revocar certificado.' });
  }
};

module.exports = {
  getCertificates,
  issueCertificate,
  downloadCertificatePdf,
  revokeCertificate,
};