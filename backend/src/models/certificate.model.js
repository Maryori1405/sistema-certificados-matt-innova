// backend/src/models/certificate.model.js
const db = require('../config/db');

const CertificateModel = {
  // Crear nuevo certificado
  create: async (data) => {
    const query = `
      INSERT INTO certificados 
        (codigo_oficial, usuario_id, modalidad, total_horas, fecha_emision, plantilla_modelo, desempeno_detalle, token_sha256, qr_imagen_url, emitido_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      data.codigo_oficial,
      data.usuario_id,
      data.modalidad,
      data.total_horas,
      data.fecha_emision,
      data.plantilla_modelo,
      data.desempeno_detalle,
      data.token_sha256,
      data.qr_imagen_url,
      data.emitido_por
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Obtener por token hash (Para validador QR público)
  findByToken: async (token) => {
    const query = `
      SELECT c.id, c.codigo_oficial, c.modalidad, c.total_horas, c.fecha_emision, 
             c.estado, c.motivo_revocacion, c.token_sha256,
             u.dni, CONCAT(u.nombres, ' ', u.apellidos) AS titular
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.token_sha256 = $1;
    `;
    const result = await db.query(query, [token]);
    return result.rows[0] || null;
  },

  // Obtener por ID (Para generación de PDF)
  findByIdWithUser: async (id) => {
    const query = `
      SELECT c.*, u.dni, CONCAT(u.nombres, ' ', u.apellidos) AS nombre_completo, u.area_asignada
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = $1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  // Listar certificados con filtro de estado
  findAll: async (estado) => {
    let query = `
      SELECT c.id, c.codigo_oficial, c.modalidad, c.total_horas, c.fecha_emision, 
             c.token_sha256, c.estado, c.motivo_revocacion,
             u.dni, CONCAT(u.nombres, ' ', u.apellidos) AS titular, u.correo_institucional
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
    `;
    const params = [];
    if (estado && (estado === 'Vigente' || estado === 'Revocado')) {
      query += ' WHERE c.estado = $1';
      params.push(estado);
    }
    query += ' ORDER BY c.id DESC;';
    const result = await db.query(query, params);
    return result.rows;
  },

  // Revocar certificado
  revoke: async (id, motivo) => {
    const query = `
      UPDATE certificados 
      SET estado = 'Revocado', motivo_revocacion = $1, fecha_revocacion = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *;
    `;
    const result = await db.query(query, [motivo, id]);
    return result.rows[0] || null;
  },

  // Contar total emitidos para autogenerar correlativo
  countTotal: async () => {
    const result = await db.query('SELECT COUNT(*) FROM certificados;');
    return parseInt(result.rows[0].count, 10);
  }
};

module.exports = CertificateModel;