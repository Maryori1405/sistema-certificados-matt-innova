-- database/init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(8) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo_institucional VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('Administrador', 'Practicante', 'Trabajador')),
    area_asignada VARCHAR(100) NOT NULL,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Certificados Emitidos
CREATE TABLE certificados (
    id SERIAL PRIMARY KEY,
    codigo_oficial VARCHAR(50) UNIQUE NOT NULL,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    modalidad VARCHAR(100) NOT NULL,
    total_horas INT NOT NULL,
    fecha_emision DATE NOT NULL,
    plantilla_modelo VARCHAR(100) DEFAULT 'Plantilla Formal Matt Innova 2026',
    desempeno_detalle TEXT NOT NULL,
    token_sha256 VARCHAR(64) UNIQUE NOT NULL,
    qr_imagen_url TEXT,
    pdf_documento_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'Vigente' CHECK (estado IN ('Vigente', 'Revocado')),
    motivo_revocacion TEXT DEFAULT NULL,
    fecha_revocacion TIMESTAMP DEFAULT NULL,
    emitido_por INT REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Auditoría / Consultas QR
CREATE TABLE auditoria_consultas_qr (
    id SERIAL PRIMARY KEY,
    certificado_id INT NOT NULL REFERENCES certificados(id) ON DELETE CASCADE,
    ip_origen VARCHAR(45),
    user_agent TEXT,
    fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices de optimización
CREATE INDEX idx_certificados_token ON certificados(token_sha256);
CREATE INDEX idx_certificados_codigo ON certificados(codigo_oficial);
CREATE INDEX idx_usuarios_dni ON usuarios(dni);