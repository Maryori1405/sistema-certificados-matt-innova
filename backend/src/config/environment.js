// backend/src/config/enviroment.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_matt_innova_2026',
  TOKEN_SECRET_PEPPER: process.env.TOKEN_SECRET_PEPPER || 'clave_interna_para_hash_sha256_2026',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};