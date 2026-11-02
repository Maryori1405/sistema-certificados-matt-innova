// backend/src/models/auditLog.model.js
const db = require('../config/db');

const AuditLogModel = {
  // Registrar consulta de validación pública
  logVerification: async (certificadoId, ip, userAgent) => {
    const query = `
      INSERT INTO auditoria_consultas_qr (certificado_id, ip_origen, user_agent)
      VALUES ($1, $2, $3)
      RETURNING id, fecha_consulta;
    `;
    const result = await db.query(query, [certificadoId, ip, userAgent]);
    return result.rows[0];
  },

  // Conteo total de consultas para el Dashboard
  countTotalScans: async () => {
    const result = await db.query('SELECT COUNT(*) FROM auditoria_consultas_qr;');
    return parseInt(result.rows[0].count, 10);
  }
};

module.exports = AuditLogModel;