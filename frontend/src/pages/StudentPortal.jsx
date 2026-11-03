// frontend/src/pages/StudentPortal.jsx
import React, { useState } from 'react';
import { 
  Search, 
  Award, 
  Download, 
  ExternalLink, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Building2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function StudentPortal() {
  const navigate = useNavigate();
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Manejo de búsqueda por DNI al endpoint público
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!dni || dni.trim().length !== 8) {
      setErrorMsg('Por favor ingresa un número de DNI válido de 8 dígitos.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSearched(true);

    try {
      // Consume el endpoint público configurado para el portal del practicante
      const res = await axiosClient.get(`/public/verify/portal/${dni.trim()}`);
      
      setStudentData(res.data.user);
      setCertificates(res.data.certificates || []);
    } catch (err) {
      console.error('Error al consultar por DNI:', err);
      if (err.response && err.response.status === 404) {
        setStudentData(null);
        setCertificates([]);
        setErrorMsg('No se encontró ningún practicante o colaborador registrado con el DNI ingresado.');
      } else {
        setErrorMsg('Error al conectar con el servidor para consultar los certificados. Verifica la conexión del backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Descarga del PDF oficial generado vectorialmente
  const handleDownloadPdf = async (certId, codigo) => {
    try {
      const res = await axiosClient.get(`/certificates/${certId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificado-${codigo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al descargar el archivo PDF de la constancia.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      {/* Barra de Navegación Superior con Logo Oficial */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center shadow-xs">
        <div className="flex items-center space-x-4">
          <img 
            src="/logo.png" 
            alt="Matt Innova Solution" 
            className="h-9 sm:h-11 w-auto max-w-[190px] object-contain filter drop-shadow-xs" 
          />
          <div className="border-l border-slate-200 pl-4 hidden sm:block">
            <h1 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
              Portal del Practicante
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400">
              Consulta y descarga directa de constancias oficiales
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Login</span>
        </button>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-4xl w-full mx-auto p-6 space-y-6 flex-grow">
        {/* Banner Informativo Superior */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200 bg-blue-800/60 px-2.5 py-1 rounded">
              Tus documentos académicos y laborales
            </span>
            <h2 className="text-xl font-extrabold mt-3 leading-snug">
              ¡Tus certificados cuentan con respaldo QR seguro!
            </h2>
            <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
              Cualquier empleador o reclutador puede validar la autenticidad e integridad de tu constancia apuntando la cámara de su celular al código QR estampado en tu PDF.
            </p>
          </div>
        </div>

        {/* Formulario de Búsqueda de DNI */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Ingresa tu documento para visualizar tus constancias
          </h3>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="Ingresa tu número de DNI (8 dígitos)"
                className="w-full pl-3 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-medium tracking-wide"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Consultando...' : 'Consultar Constancias'}</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Sección de Resultados */}
        {studentData && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-fadeIn">
            {/* Cabecera del Titular */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {studentData.nombres} {studentData.apellidos}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {studentData.tipo_usuario}
                  </span>
                  <span className="flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Área: <strong className="text-slate-700">{studentData.area_asignada}</strong></span>
                  </span>
                  <span>
                    DNI: <strong className="text-slate-700">{studentData.dni.substring(0, 2)}***{studentData.dni.substring(studentData.dni.length - 3)}</strong>
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center space-x-1.5 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Titular Activo en Base de Datos</span>
              </span>
            </div>

            {/* Listado de Constancias */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Constancias Emitidas a tu Nombre
              </h4>

              {certificates.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No registras certificados emitidos hasta la fecha. El área administrativa emitirá tu constancia al completar tus horas académicas o laborales.
                </div>
              ) : (
                certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl mt-0.5">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-bold text-sm text-slate-900">{cert.modalidad}</h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              cert.estado === 'Vigente'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {cert.estado}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Total: <strong className="text-slate-700">{cert.total_horas} horas acumuladas</strong></span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Emisión: {cert.fecha_emision}</span>
                          </span>
                          <span>
                            Código: <strong className="font-mono text-blue-600 font-bold">{cert.codigo_oficial}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleDownloadPdf(cert.id, cert.codigo_oficial)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </button>
                      <button
                        onClick={() => navigate(`/verificar/${cert.token_sha256}`)}
                        className="text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-2 border border-slate-200 rounded-lg hover:bg-white transition flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Ver cómo valida el Reclutador</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Pie de Página Institucional */}
      <footer className="text-center text-[11px] text-slate-400 py-4 border-t border-slate-200 bg-white">
        Matt Innova Solution E.I.R.L. — Cumplimiento Ley 28518 (Modalidades Formativas Laborales) & Ley 29733 (Protección de Datos Personales)
      </footer>
    </div>
  );
}