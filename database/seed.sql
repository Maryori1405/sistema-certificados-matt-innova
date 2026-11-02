-- database/seed.sql

INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, tipo_usuario, area_asignada, fecha_ingreso, estado)
VALUES 
('45892014', 'Alejandro Daniel', 'Rivas Castillo', 'admin@mattinnova.com', '$2b$10$wE99FkMhX.HnK5z9r59FneFfM5x8J87g6qY2zJjA80bC8e99Z7Keq', 'Administrador', 'Gerencia de Operaciones', '2024-01-10', 'Activo'),
('72891148', 'Jeremy Rafael', 'Herrera', 'jrafael@mattinnova.com', '$2b$10$wE99FkMhX.HnK5z9r59FneFfM5x8J87g6qY2zJjA80bC8e99Z7Keq', 'Practicante', 'Ingeniería de Sistemas', '2026-03-01', 'Activo'),
('74129912', 'Celinda Nicole', 'Valerio Cabezudo', 'cvalerio@mattinnova.com', '$2b$10$wE99FkMhX.HnK5z9r59FneFfM5x8J87g6qY2zJjA80bC8e99Z7Keq', 'Practicante', 'Diseño y Sistemas', '2026-03-01', 'Activo'),
('71658420', 'Maryori Thais', 'Nolberto Bautista', 'mnolberto@mattinnova.com', '$2b$10$wE99FkMhX.HnK5z9r59FneFfM5x8J87g6qY2zJjA80bC8e99Z7Keq', 'Practicante', 'Ingeniería de Sistemas', '2026-03-01', 'Activo'),
('10542389', 'Carlos', 'Mendoza Ramos', 'cmendoza@mattinnova.com', '$2b$10$wE99FkMhX.HnK5z9r59FneFfM5x8J87g6qY2zJjA80bC8e99Z7Keq', 'Trabajador', 'Desarrollo Web & TI', '2025-02-01', 'Activo')
ON CONFLICT (dni) DO UPDATE 
SET tipo_usuario = EXCLUDED.tipo_usuario,
    area_asignada = EXCLUDED.area_asignada;