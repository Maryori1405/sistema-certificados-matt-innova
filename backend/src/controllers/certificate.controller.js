// backend/src/controllers/certificate.controller.js
const db = require('../config/db');
const { generateCertificateHash } = require('../services/crypto.service');
const { generateVerificationQR } = require('../services/qr.service');
const { generateCertificatePdfBuffer } = require('../services/pdf.service');

const getNextCertificateCode = async () => {
  const currentYear = new Date().getFullYear();
  const countResult = await db.query('SELECT COUNT(*) FROM certificados');
  const nextNum = parseInt(countResult.rows[0].count, 10) + 1;
  return `CERT-${currentYear}-${String(nextNum).padStart(3, '0')}`;
};

const issueCertificate = async (req, res) => {
  const { usuario_id, modalidad, total_horas, fecha_emision, desempeno_detalle, plantilla_modelo } = req.body;

  if (!usuario_id || !modalidad || !total_horas || !fecha_emision || !desempeno_detalle) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    const userResult = await db.query('SELECT * FROM usuarios WHERE id = $1', [usuario_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Colaborador no encontrado.' });
    }
    const targetUser = userResult.rows[0];

    const codigo_oficial = await getNextCertificateCode();
    const token_sha256 = generateCertificateHash(codigo_oficial, targetUser.dni, fecha_emision);
    const { qrImageDataUrl } = await generateVerificationQR(token_sha256);

    const insertQuery = `
      INSERT INTO certificados 
        (codigo_oficial, usuario_id, modalidad, total_horas, fecha_emision, plantilla_modelo, desempeno_detalle, token_sha256, qr_imagen_url, emitido_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const insertValues = [
      codigo_oficial,
      usuario_id,
      modalidad,
      parseInt(total_horas, 10),
      fecha_emision,
      plantilla_modelo || 'Plantilla Formal Matt Innova 2026',
      desempeno_detalle,
      token_sha256,
      qrImageDataUrl,
      req.user.id,
    ];

    const certResult = await db.query(insertQuery, insertValues);

    res.status(201).json({
      message: 'Certificado emitido exitosamente con firma SHA-256 y QR.',
      certificate: certResult.rows[0],
    });
  } catch (error) {
    console.error('Error al emitir:', error);
    res.status(500).json({ message: 'Error interno al registrar el certificado.' });
  }
};

const listCertificates = async (req, res) => {
  const { estado } = req.query;
  try {
    let query = `
      SELECT c.id, c.codigo_oficial, c.modalidad, c.total_horas, c.fecha_emision, 
             c.token_sha256, c.estado, c.motivo_revocacion,
             u.dni, CONCAT(u.nombres, ' ', u.apellidos) AS titular, u.correo_institucional
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
    `;
    const params = [];

    if (estado && (estado === 'Vigente' || estado === 'Revocado')) {
      query += ` WHERE c.estado = $1`;
      params.push(estado);
    }
    query += ` ORDER BY c.id DESC;`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar:', error);
    res.status(500).json({ message: 'Error al obtener la lista de certificados.' });
  }
};

const revokeCertificate = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  if (!motivo) {
    return res.status(400).json({ message: 'Debe ingresar un motivo para revocar.' });
  }

  try {
    const updateResult = await db.query(
      `UPDATE certificados 
       SET estado = 'Revocado', motivo_revocacion = $1, fecha_revocacion = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [motivo, id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Certificado no hallado.' });
    }

    res.json({
      message: 'Certificado revocado exitosamente.',
      certificate: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error al revocar:', error);
    res.status(500).json({ message: 'Error interno al revocar el documento.' });
  }
};

const downloadCertificatePdf = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT c.*, u.dni, CONCAT(u.nombres, ' ', u.apellidos) AS nombre_completo, u.area_asignada
       FROM certificados c
       JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Certificado no encontrado.' });
    }

    const cert = result.rows[0];
    const dniRaw = cert.dni || '';
    const dniEnmascarado = dniRaw.length >= 8 
      ? `${dniRaw.substring(0, 2)}***${dniRaw.substring(dniRaw.length - 3)}`
      : dniRaw;

    const pdfBuffer = await generateCertificatePdfBuffer(
      {
        nombreCompleto: cert.nombre_completo,
        dniEnmascarado,
        modalidad: cert.modalidad,
        area_asignada: cert.area_asignada,
        total_horas: cert.total_horas,
        codigo_oficial: cert.codigo_oficial,
        fecha_emision: new Date(cert.fecha_emision).toLocaleDateString('es-PE'),
      },
      cert.qr_imagen_url
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.codigo_oficial}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ message: 'Error al generar el archivo PDF.' });
  }
};

// Métricas completas para el Dashboard con entrega obligatoria de token_sha256
const getDashboardStats = async (req, res) => {
  try {
    // 1. Contadores generales
    const countCert = await db.query('SELECT COUNT(*) FROM certificados');
    const total_emitidos = parseInt(countCert.rows[0].count, 10);

    const countVigentes = await db.query("SELECT COUNT(*) FROM certificados WHERE estado = 'Vigente'");
    const certificados_vigentes = parseInt(countVigentes.rows[0].count, 10);

    const countUsers = await db.query("SELECT tipo_usuario, COUNT(*) FROM usuarios WHERE tipo_usuario IN ('Practicante', 'Trabajador') GROUP BY tipo_usuario");
    let practicantes = 0;
    let trabajadores = 0;
    countUsers.rows.forEach(r => {
      if (r.tipo_usuario === 'Practicante') practicantes = parseInt(r.count, 10);
      if (r.tipo_usuario === 'Trabajador') trabajadores = parseInt(r.count, 10);
    });

    let consultas_qr_totales = 0;
    try {
      const countAudit = await db.query('SELECT COUNT(*) FROM auditoria_consultas_qr');
      consultas_qr_totales = parseInt(countAudit.rows[0].count, 10);
    } catch (e) {
      consultas_qr_totales = 0;
    }

    // 2. Acreditaciones recientes con inclusión explícita del token_sha256
    const recentQuery = `
      SELECT 
        c.id, 
        c.codigo_oficial, 
        c.modalidad, 
        c.fecha_emision, 
        c.estado, 
        c.token_sha256,
        u.dni, 
        CONCAT(u.nombres, ' ', u.apellidos) AS titular
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.id DESC
      LIMIT 5;
    `;
    const recentResult = await db.query(recentQuery);

    res.json({
      metricas: {
        total_emitidos,
        colaboradores_total: practicantes + trabajadores,
        desglose_colaboradores: { practicantes, trabajadores },
        certificados_vigentes,
        consultas_qr_totales,
      },
      acreditaciones_recientes: recentResult.rows,
    });
  } catch (error) {
    console.error('Error al cargar dashboard stats:', error);
    res.status(500).json({ message: 'Error interno al recopilar estadísticas del dashboard.' });
  }
};

module.exports = {
  issueCertificate,
  listCertificates,
  revokeCertificate,
  downloadCertificatePdf,
  getDashboardStats,
};