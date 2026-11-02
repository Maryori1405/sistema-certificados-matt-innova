// frontend/src/pages/PublicVerify.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function PublicVerify() {
  const params = useParams();
  // Acepta cualquier nombre de parámetro definido en App.jsx (:token, :codigo, :id o el primer valor disponible)
  const token = params.token || params.codigo || params.hash || Object.values(params)[0];
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!token) {
        setLoading(false);
        setErrorMsg('No se especificó un token de validación válido.');
        return;
      }

      try {
        setLoading(true);
        // Consulta pública al backend en Render
        const res = await axiosClient.get(`/public/verify/${token}`);
        
        // Maneja diferentes estructuras de respuesta comunes del backend
        const certData = res.data?.certificado || res.data?.certificate || res.data?.data || null;
        const validStatus = res.data?.valido ?? (certData?.estado === 'Vigente');

        setCert(certData);
        setIsValid(Boolean(validStatus && certData?.estado !== 'Revocado'));
      } catch (err) {
        console.error('Error al validar certificado:', err);
        setIsValid(false);
        setErrorMsg(err.response?.data?.message || 'El certificado no existe o el token criptográfico ha sido alterado.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [token]);

  // Retorno a la pantalla anterior del panel
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleDownload = async () => {
    if (!cert?.id) return;
    try {
      const res = await axiosClient.get(`/certificates/${cert.id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificado-${cert.codigo_oficial || cert.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar la constancia PDF.');
    }
  };

  // Enmascaramiento de DNI conforme a Ley 29733 (ej: 72***148)
  const getMaskedDni = (dni) => {
    if (!dni || String(dni).length < 5) return dni || '---';
    const str = String(dni);
    return `${str.substring(0, 2)}***${str.substring(str.length - 3)}`;
  };

  return (
    <div className="min-h-screen bg-[#0C1322] flex flex-col items-center justify-center p-4">
      {/* Botón de retorno superior */}
      <div className="w-full max-w-sm mb-3 flex justify-between items-center">
        <button
          onClick={handleGoBack}
          className="text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Panel</span>
        </button>
        <span className="text-[10px] text-slate-400 font-mono">SHA-256 Verifier</span>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
        {/* Cabecera Móvil Institucional */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-blue-600 text-white font-black flex items-center justify-center text-xs">
              M
            </div>
            <span className="text-xs font-bold text-slate-800">certificados.mattinnova.com</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            SSL Seguro
          </span>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Consultando token en Neon Cloud...</p>
            </div>
          ) : isValid && cert ? (
            <>
              {/* Bloque Sello Verde VIGENTE */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h2 className="text-sm font-extrabold text-emerald-800 tracking-wide uppercase">
                  CERTIFICADO OFICIAL VÁLIDO
                </h2>
                <p className="text-[11px] text-emerald-700">
                  Documento emitido y autenticado institucionalmente en el repositorio central de Matt Innova Solution.
                </p>
              </div>

              {/* Ficha de Datos del Certificado */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">DATOS OFICIALES</span>
                  <span className="font-mono font-bold text-blue-600">{cert.codigo_oficial}</span>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">Titular del Documento</p>
                  <p className="font-bold text-slate-900 text-sm">{cert.titular}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400">DNI (Ley 29733)</p>
                    <p className="font-semibold text-slate-700 font-mono">{getMaskedDni(cert.dni)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Horas Convalidadas</p>
                    <p className="font-semibold text-slate-700">{cert.total_horas} Horas</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400">Modalidad Acreditada</p>
                    <p className="font-semibold text-blue-600">{cert.modalidad}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Firma Digital</p>
                    <p className="font-semibold text-emerald-600 flex items-center">
                      <span>Verificada</span>
                      <ShieldCheck className="w-3.5 h-3.5 ml-1" />
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <p className="text-[10px] text-slate-400">Fecha de Emisión</p>
                  <p className="font-medium text-slate-700">
                    {cert.fecha_emision ? new Date(cert.fecha_emision).toLocaleDateString('es-PE') : '---'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Copia de Respaldo PDF</span>
              </button>
            </>
          ) : (
            <>
              {/* Bloque Alerta Roja REVOCADO O INEXISTENTE */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-1">
                <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h2 className="text-sm font-extrabold text-rose-800 tracking-wide uppercase">
                  {cert?.estado === 'Revocado' ? 'CERTIFICADO ANULADO / REVOCADO' : 'CERTIFICADO NO VÁLIDO'}
                </h2>
                <p className="text-[11px] text-rose-700 leading-tight">
                  {cert?.motivo_revocacion 
                    ? `Motivo: ${cert.motivo_revocacion}`
                    : errorMsg || 'Este certificado ha sido revocado en el repositorio oficial o no existe en la base de datos.'}
                </p>
              </div>

              {cert && (
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">DATOS REGISTRADOS</span>
                    <span className="font-mono font-bold text-slate-500">{cert.codigo_oficial}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Titular del Documento</p>
                    <p className="font-bold text-slate-900">{cert.titular}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400">DNI (Ley 29733)</p>
                      <p className="font-semibold text-slate-700 font-mono">{getMaskedDni(cert.dni)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Estado Actual</p>
                      <p className="font-bold text-rose-600">{cert.estado}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <p className="text-[9px] text-slate-400 text-center pt-2 border-t border-slate-100">
            Consulta protegida con hash criptográfico SHA-256 e IP anónima.
          </p>
        </div>
      </div>
    </div>
  );
}