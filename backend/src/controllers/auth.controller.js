// backend/src/controllers/auth.controller.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Inicio de Sesión
const login = async (req, res) => {
  let { correo_institucional, password } = req.body;

  // Limpieza de espacios accidentales y normalización a minúsculas
  correo_institucional = correo_institucional ? correo_institucional.trim().toLowerCase() : '';
  password = password ? String(password).trim() : '';

  if (!correo_institucional || !password) {
    return res.status(400).json({ message: 'Ingresa correo y contraseña.' });
  }

  try {
    // Búsqueda insensible a mayúsculas/minúsculas en PostgreSQL
    const result = await db.query(
      'SELECT id, dni, nombres, apellidos, correo_institucional, password_hash, tipo_usuario, area_asignada, estado FROM usuarios WHERE LOWER(correo_institucional) = LOWER($1)',
      [correo_institucional]
    );

    if (result.rows.length === 0) {
      console.warn(`[AUTH] Intento de login fallido: Usuario no encontrado (${correo_institucional})`);
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (user.estado !== 'Activo') {
      console.warn(`[AUTH] Intento de login fallido: Usuario inactivo (${correo_institucional})`);
      return res.status(403).json({ message: 'El usuario se encuentra inactivo.' });
    }

    // Comparación de la contraseña contra el hash Bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      console.warn(`[AUTH] Intento de login fallido: Contraseña incorrecta para ${correo_institucional}`);
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    console.log(`[AUTH] Login exitoso: ${user.correo_institucional} (${user.tipo_usuario})`);

    // Generación del token JWT
    const token = jwt.sign(
      {
        id: user.id,
        dni: user.dni,
        nombreCompleto: `${user.nombres} ${user.apellidos}`,
        tipo_usuario: user.tipo_usuario,
      },
      process.env.JWT_SECRET || 'super_secret_jwt_key_matt_innova_2026',
      { expiresIn: '8h' }
    );

    return res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        dni: user.dni,
        nombres: user.nombres,
        apellidos: user.apellidos,
        correo_institucional: user.correo_institucional,
        tipo_usuario: user.tipo_usuario,
        area_asignada: user.area_asignada,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
};

// 2. Obtener Pregunta de Seguridad por DNI o Correo
const getSecurityQuestion = async (req, res) => {
  const { identificador } = req.body;

  if (!identificador || !identificador.trim()) {
    return res.status(400).json({ message: 'Debe ingresar su DNI o correo institucional.' });
  }

  try {
    const cleanId = identificador.trim().toLowerCase();
    const result = await db.query(
      `SELECT id, correo_institucional, pregunta_seguridad 
       FROM usuarios 
       WHERE LOWER(correo_institucional) = $1 OR dni = $2 
       LIMIT 1;`,
      [cleanId, identificador.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró ningún usuario con esos datos.' });
    }

    const user = result.rows[0];

    if (!user.pregunta_seguridad || user.pregunta_seguridad.trim() === '') {
      return res.status(400).json({ 
        message: 'El usuario no tiene configurada una pregunta de seguridad. Solicite restablecimiento al administrador.' 
      });
    }

    return res.json({
      userId: user.id,
      correo: user.correo_institucional,
      pregunta: user.pregunta_seguridad
    });
  } catch (error) {
    console.error('Error al consultar pregunta de seguridad:', error);
    return res.status(500).json({ message: 'Error en el servidor al consultar la pregunta.' });
  }
};

// 3. Validar Respuesta Secreta y Restablecer Contraseña
const resetPasswordWithSecurityAnswer = async (req, res) => {
  const { userId, respuesta, nuevaPassword } = req.body;

  if (!userId || !respuesta || !nuevaPassword) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  const cleanPassword = String(nuevaPassword).trim();
  if (cleanPassword.length < 6) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const result = await db.query(
      `SELECT id, respuesta_seguridad FROM usuarios WHERE id = $1;`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const user = result.rows[0];

    if (!user.respuesta_seguridad) {
      return res.status(400).json({ message: 'El usuario no tiene una respuesta de seguridad registrada.' });
    }

    const respuestaGuardada = user.respuesta_seguridad.trim().toLowerCase();
    const respuestaIngresada = String(respuesta).trim().toLowerCase();

    // Comprobación insensible a mayúsculas y espacios laterales
    if (respuestaGuardada !== respuestaIngresada) {
      return res.status(400).json({ message: 'La respuesta a la pregunta de seguridad es incorrecta.' });
    }

    // Hasheo de la nueva clave con bcrypt
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(cleanPassword, salt);

    await db.query(
      `UPDATE usuarios SET password_hash = $1 WHERE id = $2;`,
      [newPasswordHash, userId]
    );

    return res.json({ message: '¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return res.status(500).json({ message: 'Error interno al actualizar la contraseña.' });
  }
};

module.exports = {
  login,
  getSecurityQuestion,
  resetPasswordWithSecurityAnswer
};