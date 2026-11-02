// backend/src/models/user.model.js
const db = require('../config/db');

const UserModel = {
  // Buscar por correo (login)
  findByEmail: async (correo) => {
    const query = `
      SELECT id, dni, nombres, apellidos, correo_institucional, password_hash, tipo_usuario, area_asignada, estado 
      FROM usuarios 
      WHERE LOWER(correo_institucional) = LOWER($1);
    `;
    const result = await db.query(query, [correo]);
    return result.rows[0] || null;
  },

  // Buscar por ID
  findById: async (id) => {
    const query = 'SELECT * FROM usuarios WHERE id = $1;';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  // Verificar si ya existe DNI o Correo
  existsDniOrEmail: async (dni, correo) => {
    const query = 'SELECT id FROM usuarios WHERE dni = $1 OR correo_institucional = $2;';
    const result = await db.query(query, [dni, correo]);
    return result.rows.length > 0;
  },

  // Crear nuevo colaborador o practicante
  create: async ({ dni, nombres, apellidos, correo_institucional, password_hash, tipo_usuario, area_asignada }) => {
    const query = `
      INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, tipo_usuario, area_asignada, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Activo')
      RETURNING id, dni, nombres, apellidos, correo_institucional, tipo_usuario, area_asignada, fecha_ingreso, estado;
    `;
    const result = await db.query(query, [dni, nombres, apellidos, correo_institucional, password_hash, tipo_usuario, area_asignada]);
    return result.rows[0];
  },

  // Listar con filtro y paginación
  findPaginated: async (searchTerm, limit, offset) => {
    let query = `
      SELECT id, dni, nombres, apellidos, correo_institucional, tipo_usuario, area_asignada, fecha_ingreso, estado
      FROM usuarios
      WHERE (tipo_usuario = 'Practicante' OR tipo_usuario = 'Trabajador')
    `;
    const params = [];

    if (searchTerm && searchTerm.trim() !== '') {
      params.push(`%${searchTerm.trim()}%`);
      query += ` AND (dni ILIKE $${params.length} OR CONCAT(nombres, ' ', apellidos) ILIKE $${params.length})`;
    }

    // Contar total
    const countQuery = query.replace('id, dni, nombres, apellidos, correo_institucional, tipo_usuario, area_asignada, fecha_ingreso, estado', 'COUNT(*)');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Consulta con orden y límites
    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2};`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return { users: result.rows, total };
  }
};

module.exports = UserModel;