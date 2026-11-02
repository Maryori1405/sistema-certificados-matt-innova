// backend/src/controllers/stats.controller.js
const db = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const totalEmitidos = await db.query('SELECT COUNT(*) FROM certificados');
    const totalPracticantes = await db.query("SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'Practicante'");
    const totalTrabajadores = await db.query("SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'Trabajador'");
    const certificadosVigentes = await db.query("SELECT COUNT(*) FROM certificados WHERE estado = 'Vigente'");
    const totalConsultasQr = await db.query('SELECT COUNT(*) FROM auditoria_consultas_qr');

    const ultimosCertificados = await db.query(`
      SELECT c.id, c.codigo_oficial, c.modalidad, c.fecha_emision, c.estado,
             u.dni, CONCAT(u.nombres, ' ', u.apellidos) AS titular
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.id DESC LIMIT 5
    `);

    const ultimosConDniEnmascarado = ultimosCertificados.rows.map((item) => ({
      ...item,
      dni: `${item.dni.substring(0, 2)}**${item.dni.substring(item.dni.length - 3)}`,
    }));

    res.json({
      metricas: {
        total_emitidos: parseInt(totalEmitidos.rows[0].count, 10),
        colaboradores_total: parseInt(totalPracticantes.rows[0].count, 10) + parseInt(totalTrabajadores.rows[0].count, 10),
        desglose_colaboradores: {
          practicantes: parseInt(totalPracticantes.rows[0].count, 10),
          trabajadores: parseInt(totalTrabajadores.rows[0].count, 10),
        },
        certificados_vigentes: parseInt(certificadosVigentes.rows[0].count, 10),
        consultas_qr_totales: parseInt(totalConsultasQr.rows[0].count, 10),
      },
      acreditaciones_recientes: ultimosConDniEnmascarado,
    });
  } catch (error) {
    console.error('Error stats:', error);
    res.status(500).json({ message: 'Error al obtener datos estadísticos.' });
  }
};

module.exports = { getDashboardStats };