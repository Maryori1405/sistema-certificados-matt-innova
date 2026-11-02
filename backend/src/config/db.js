// backend/src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Requerido para conexiones cloud seguras en Neon
  },
});

pool.on('connect', () => {
  console.log(' Conectado exitosamente a PostgreSQL en Neon Cloud');
});

pool.on('error', (err) => {
  console.error(' Error en la conexión con Neon:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};