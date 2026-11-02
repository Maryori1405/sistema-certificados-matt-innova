// backend/src/controllers/user.controller.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. Listar Colaboradores y Administradores
const listUsers = async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const offset = (page - 1) * limit;

    let baseQuery = `FROM usuarios WHERE 1=1`;
    const params = [];

    if (search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      baseQuery += ` AND (dni ILIKE $${params.length} OR CONCAT(nombres, ' ', apellidos) ILIKE $${params.length} OR correo_institucional ILIKE $${params.length})`;
    }

    const countResult = await db.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit) || 1;

    const dataQuery = `
      SELECT id, dni, nombres, apellidos, correo_institucional, tipo_usuario, area_asignada, fecha_ingreso, estado, pregunta_seguridad
      ${baseQuery}
      ORDER BY id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    params.push(limit, offset);

    const result = await db.query(dataQuery, params);

    return res.json({
      users: result.rows,
      total,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ message: 'Error interno al consultar usuarios.' });
  }
};

// 2. Registrar Nuevo Usuario (Practicante, Trabajador o Administrador)
const createUser = async (req, res) => {
  const { 
    dni, 
    nombres, 
    apellidos, 
    correo_institucional, 
    password, 
    tipo_usuario, 
    area_asignada, 
    pregunta_seguridad, 
    respuesta_seguridad 
  } = req.body;

  if (!dni || !nombres || !apellidos || !correo_institucional) {
    return res.status(400).json({ message: 'DNI, nombres, apellidos y correo son obligatorios.' });
  }

  const cleanDni = dni.trim();
  if (cleanDni.length !== 8 || !/^\d+$/.test(cleanDni)) {
    return res.status(400).json({ message: 'El DNI debe contener exactamente 8 dígitos numéricos.' });
  }

  try {
    const checkExist = await db.query(
      'SELECT id FROM usuarios WHERE dni = $1 OR correo_institucional = $2;',
      [cleanDni, correo_institucional.trim().toLowerCase()]
    );

    if (checkExist.rows.length > 0) {
      return res.status(400).json({ message: 'Ya existe un usuario registrado con ese DNI o correo.' });
    }

    // Si especificó contraseña se usa esa; de lo contrario, el DNI como clave inicial
    const plainPassword = password && password.trim().length >= 6 ? password.trim() : cleanDni;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    const insertQuery = `
      INSERT INTO usuarios (
        dni, nombres, apellidos, correo_institucional, password_hash, 
        tipo_usuario, area_asignada, fecha_ingreso, estado, 
        pregunta_seguridad, respuesta_seguridad
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'Activo', $8, $9)
      RETURNING id, dni, nombres, apellidos, correo_institucional, tipo_usuario, area_asignada, estado, pregunta_seguridad;
    `;
    const values = [
      cleanDni,
      nombres.trim(),
      apellidos.trim(),
      correo_institucional.trim().toLowerCase(),
      passwordHash,
      tipo_usuario || 'Practicante',
      area_asignada || 'Sistemas',
      pregunta_seguridad ? pregunta_seguridad.trim() : null,
      respuesta_seguridad ? respuesta_seguridad.trim().toLowerCase() : null
    ];

    const result = await db.query(insertQuery, values);
    return res.status(201).json({
      message: 'Usuario registrado exitosamente con sus credenciales de acceso.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ message: 'Error en el servidor al registrar el usuario.' });
  }
};

// 3. Modificar datos, contraseña o pregunta/respuesta
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { 
    dni, 
    nombres, 
    apellidos, 
    correo_institucional, 
    password, 
    tipo_usuario, 
    area_asignada, 
    estado,
    pregunta_seguridad,
    respuesta_seguridad
  } = req.body;

  if (!dni || !nombres || !apellidos || !correo_institucional) {
    return res.status(400).json({ message: 'DNI, nombres, apellidos y correo son requeridos.' });
  }

  const cleanDni = dni.trim();
  if (cleanDni.length !== 8 || !/^\d+$/.test(cleanDni)) {
    return res.status(400).json({ message: 'El DNI debe contener exactamente 8 dígitos numéricos.' });
  }

  try {
    const dniCheck = await db.query(
      'SELECT id FROM usuarios WHERE dni = $1 AND id != $2;',
      [cleanDni, id]
    );
    if (dniCheck.rows.length > 0) {
      return res.status(400).json({ message: 'El número de DNI ya está registrado por otro usuario.' });
    }

    const emailCheck = await db.query(
      'SELECT id FROM usuarios WHERE correo_institucional = $1 AND id != $2;',
      [correo_institucional.trim().toLowerCase(), id]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado por otro usuario.' });
    }

    // Actualización condicional de contraseña si el admin la escribió
    let passwordClause = '';
    const params = [
      cleanDni,
      nombres.trim(),
      apellidos.trim(),
      correo_institucional.trim().toLowerCase(),
      tipo_usuario,
      area_asignada,
      estado,
      pregunta_seguridad ? pregunta_seguridad.trim() : null
    ];

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password.trim(), salt);
      params.push(newHash);
      passwordClause = `, password_hash = $${params.length}`;
    }

    let respuestaClause = '';
    if (respuesta_seguridad && respuesta_seguridad.trim() !== '') {
      params.push(respuesta_seguridad.trim().toLowerCase());
      respuestaClause = `, respuesta_seguridad = $${params.length}`;
    }

    params.push(id);
    const idPos = params.length;

    const updateQuery = `
      UPDATE usuarios
      SET dni = $1,
          nombres = $2,
          apellidos = $3,
          correo_institucional = $4,
          tipo_usuario = COALESCE($5, tipo_usuario),
          area_asignada = COALESCE($6, area_asignada),
          estado = COALESCE($7, estado),
          pregunta_seguridad = COALESCE($8, pregunta_seguridad)
          ${passwordClause}
          ${respuestaClause}
      WHERE id = $${idPos}
      RETURNING id, dni, nombres, apellidos, correo_institucional, tipo_usuario, area_asignada, estado, pregunta_seguridad;
    `;

    const result = await db.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({
      message: 'Usuario y credenciales actualizados exitosamente.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ message: 'Error interno en el servidor al actualizar datos.' });
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
};