// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import IssueCertificate from './pages/IssueCertificate';
import CertificatesList from './pages/CertificatesList';
import StudentPortal from './pages/StudentPortal';
import PublicVerify from './pages/PublicVerify';
import AppLayout from './components/layout/AppLayout';
import Settings from './pages/Settings';
import QrValidations from './pages/QrValidations';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección inicial y Autenticación */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-password" element={<ForgotPassword />} />

        {/* Portales Públicos (Consulta DNI y Escaneo QR SHA-256) */}
        <Route path="/portal-practicante" element={<StudentPortal />} />
        <Route path="/verificar/:codigo" element={<PublicVerify />} />

        {/* Panel Administrativo Protegido */}
        <Route path="/admin/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/admin/colaboradores" element={<AppLayout><Directory /></AppLayout>} />
        <Route path="/admin/emitir" element={<AppLayout><IssueCertificate /></AppLayout>} />
        <Route path="/admin/certificados" element={<AppLayout><CertificatesList /></AppLayout>} />
        <Route path="/admin/validaciones-qr" element={<AppLayout><QrValidations /></AppLayout>} />
        <Route path="/admin/configuracion" element={<AppLayout><Settings /></AppLayout>} />

        {/* Captura de rutas no definidas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}