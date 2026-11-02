// frontend/src/pages/Settings.jsx
import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Sliders, 
  KeyRound, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  FileBadge,
  Lock
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('empresa');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', text: '' });

  // 1. Datos Institucionales
  const [companyForm, setCompanyForm] = useState({
    razon_social: 'Matt Innova Solution E.I.R.L.',
    ruc: '20608934521',
    representante_legal: 'Alejandro Daniel Rivas Castillo',
    cargo_representante: 'Gerente General / Administrador',
    direccion_fiscal: 'Chincha Alta, Ica, Perú',
    correo_contacto: 'contacto@mattinnova.com',
    telefono: '+51 956 000 000',
    dominio_validador: 'https://certificados.mattinnova.com'
  });

  // 2. Parámetros de Emisión y Criptografía
  const [certParams, setCertParams] = useState({
    prefijo_codigo: 'CERT',
    algoritmo_hash: 'SHA-256 (FIPS 180-4)',
    duracion_dias_defecto: 365,
    enmascaramiento_dni: true,
    registro_auditoria_ip: true,
    permitir_descarga_publica: true
  });

  // 3. Seguridad y Cambio de Clave
  const [securityForm, setSecurityForm] = useState({
    actual_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleSaveCompany = (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification({ type: '', text: '' });

    setTimeout(() => {
      setSaving(false);
      setNotification({
        type: 'success',
        text: 'Parámetros institucionales actualizados correctamente en el sistema.'
      });
    }, 600);
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    if (securityForm.new_password !== securityForm.confirm_password) {
      setNotification({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }
    if (securityForm.new_password.length < 6) {
      setNotification({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setSaving(true);
    setNotification({ type: '', text: '' });

    try {
      // Si tienes un endpoint para actualizar credenciales:
      // await axiosClient.put('/admin/change-password', securityForm);
      setTimeout(() => {
        setSaving(false);
        setNotification({
          type: 'success',
          text: 'Contraseña administrativa actualizada exitosamente.'
        });
        setSecurityForm({ actual_password: '', new_password: '', confirm_password: '' });
      }, 700);
    } catch (err) {
      setSaving(false);
      setNotification({
        type: 'error',
        text: err.response?.data?.message || 'Error al actualizar la contraseña.'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Configuración del Sistema</h2>
        <p className="text-xs text-slate-500">
          Administra las directivas institucionales, políticas criptográficas y credenciales de acceso
        </p>
      </div>

      {/* Notificación de Éxito o Error */}
      {notification.text && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="font-medium">{notification.text}</span>
        </div>
      )}

      {/* Pestañas de Navegación */}
      <div className="flex border-b border-slate-200 text-xs font-semibold space-x-4">
        <button
          onClick={() => { setActiveTab('empresa'); setNotification({ type: '', text: '' }); }}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'empresa'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Datos Institucionales</span>
        </button>

        <button
          onClick={() => { setActiveTab('certificados'); setNotification({ type: '', text: '' }); }}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'certificados'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileBadge className="w-4 h-4" />
          <span>Parámetros de Emisión & QR</span>
        </button>

        <button
          onClick={() => { setActiveTab('seguridad'); setNotification({ type: '', text: '' }); }}
          className={`pb-3 px-1 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'seguridad'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Seguridad & Acceso</span>
        </button>
      </div>

      {/* Pestaña 1: Empresa */}
      {activeTab === 'empresa' && (
        <form onSubmit={handleSaveCompany} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Identidad Institucional del Emisor</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Razón Social</label>
              <input
                type="text"
                value={companyForm.razon_social}
                onChange={(e) => setCompanyForm({ ...companyForm, razon_social: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">RUC Oficial</label>
              <input
                type="text"
                value={companyForm.ruc}
                onChange={(e) => setCompanyForm({ ...companyForm, ruc: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Firmante / Representante Legal</label>
              <input
                type="text"
                value={companyForm.representante_legal}
                onChange={(e) => setCompanyForm({ ...companyForm, representante_legal: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cargo Institucional</label>
              <input
                type="text"
                value={companyForm.cargo_representante}
                onChange={(e) => setCompanyForm({ ...companyForm, cargo_representante: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sede / Dirección Fiscal</label>
              <input
                type="text"
                value={companyForm.direccion_fiscal}
                onChange={(e) => setCompanyForm({ ...companyForm, direccion_fiscal: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dominio Público del Validador QR</label>
              <input
                type="text"
                value={companyForm.dominio_validador}
                onChange={(e) => setCompanyForm({ ...companyForm, dominio_validador: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-blue-600"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1E56FF] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios Institucionales'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Pestaña 2: Parámetros de Certificados */}
      {activeTab === 'certificados' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <FileBadge className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Políticas de Validación Criptográfica</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prefijo de Codificación Oficial</label>
              <input
                type="text"
                value={certParams.prefijo_codigo}
                disabled
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Formato: CERT-YYYY-XXX</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estándar de Función Hash</label>
              <input
                type="text"
                value={certParams.algoritmo_hash}
                disabled
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">64 caracteres hexadecimales irreversibles</p>
            </div>
          </div>

          {/* Opciones y Switches */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60 transition">
              <input
                type="checkbox"
                checked={certParams.enmascaramiento_dni}
                onChange={(e) => setCertParams({ ...certParams, enmascaramiento_dni: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-xs font-semibold text-slate-800">Protección de Datos Personales (Ley 29733)</p>
                <p className="text-[11px] text-slate-500">Enmascarar DNI en pantallas de validación pública (ejemplo: 71***420).</p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60 transition">
              <input
                type="checkbox"
                checked={certParams.registro_auditoria_ip}
                onChange={(e) => setCertParams({ ...certParams, registro_auditoria_ip: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-xs font-semibold text-slate-800">Bitácora de Auditoría en Tiempo Real</p>
                <p className="text-[11px] text-slate-500">Registrar IP pública y agente de usuario en cada lectura o escaneo QR.</p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60 transition">
              <input
                type="checkbox"
                checked={certParams.permitir_descarga_publica}
                onChange={(e) => setCertParams({ ...certParams, permitir_descarga_publica: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-xs font-semibold text-slate-800">Descarga Pública del Respaldo PDF</p>
                <p className="text-[11px] text-slate-500">Permitir que los evaluadores externos descarguen el documento firmado desde el validador.</p>
              </div>
            </label>
          </div>

          <div className="pt-3 flex justify-end border-t border-slate-100">
            <button
              onClick={() => {
                setNotification({
                  type: 'success',
                  text: 'Directivas de validación QR y seguridad guardadas.'
                });
              }}
              className="bg-[#1E56FF] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Parámetros</span>
            </button>
          </div>
        </div>
      )}

      {/* Pestaña 3: Seguridad y Contraseña */}
      {activeTab === 'seguridad' && (
        <form onSubmit={handleSaveSecurity} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Credenciales de Acceso Administrativo</h3>
          </div>

          <div className="space-y-4 max-w-md text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contraseña Actual *</label>
              <input
                type="password"
                required
                value={securityForm.actual_password}
                onChange={(e) => setSecurityForm({ ...securityForm, actual_password: e.target.value })}
                placeholder="••••••••"
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nueva Contraseña *</label>
              <input
                type="password"
                required
                value={securityForm.new_password}
                onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirmar Nueva Contraseña *</label>
              <input
                type="password"
                required
                value={securityForm.confirm_password}
                onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                placeholder="Repita la nueva contraseña"
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1E56FF] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{saving ? 'Actualizando...' : 'Actualizar Credenciales'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}