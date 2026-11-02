// frontend/src/pages/IssueCertificate.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  FileCheck2 
} from 'lucide-react';
import QRCode from 'qrcode';
import axiosClient from '../api/axiosClient';

export default function IssueCertificate() {
  const [collaborators, setCollaborators] = useState([]);
  const [formData, setFormData] = useState({
    usuario_id: '',
    titularNombre: '',
    dniEnmascarado: '',
    area: '',
    modalidad: 'Prácticas Preprofesionales',
    total_horas: '480',
    fecha_emision: new Date().toISOString().split('T')[0],
    plantilla_modelo: 'Plantilla Formal Elite (Borde Monumental + Guilloche + Circuitos)',
    desempeno_detalle: 'demostrando alto compromiso ético y profesional en los proyectos asignados.',
  });

  const [qrPreview, setQrPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Cargar lista de colaboradores
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosClient.get('/users?limit=100');
        const list = Array.isArray(res.data) ? res.data : (res.data.users || []);
        setCollaborators(list);

        if (list.length > 0) {
          const first = list[0];
          const dniStr = String(first.dni || '');
          const masked = dniStr.length >= 5 
            ? `${dniStr.substring(0, 2)}***${dniStr.substring(dniStr.length - 3)}`
            : dniStr;

          setFormData(prev => ({
            ...prev,
            usuario_id: first.id ?? first._id,
            titularNombre: `${first.nombres} ${first.apellidos}`,
            dniEnmascarado: masked,
            area: first.area_asignada || 'Ingeniería de Sistemas',
          }));
        }
      } catch (err) {
        console.error('Error al cargar colaboradores:', err);
      }
    };
    fetchUsers();
  }, []);

  // 2. Generar QR para la vista previa
  useEffect(() => {
    const previewUrl = `https://certificados.mattinnova.com/verificar/PREVIEW-${formData.usuario_id || 'CERT'}-${formData.total_horas}`;
    QRCode.toDataURL(previewUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0A1931',
        light: '#FFFFFF',
      }
    }).then(setQrPreview).catch(console.error);
  }, [formData.usuario_id, formData.total_horas]);

  // 3. Manejar cambio en el selector de colaborador
  const handleUserChange = (e) => {
    const selectedId = e.target.value;
    const selectedUser = collaborators.find(c => String(c.id ?? c._id) === String(selectedId));

    if (selectedUser) {
      const dniStr = String(selectedUser.dni || '');
      const masked = dniStr.length >= 5 
        ? `${dniStr.substring(0, 2)}***${dniStr.substring(dniStr.length - 3)}`
        : dniStr;

      setFormData(prev => ({
        ...prev,
        usuario_id: selectedUser.id ?? selectedUser._id,
        titularNombre: `${selectedUser.nombres} ${selectedUser.apellidos}`,
        dniEnmascarado: masked,
        area: selectedUser.area_asignada || 'Ingeniería de Sistemas',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.usuario_id) {
      alert('Por favor selecciona un colaborador válido.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await axiosClient.post('/certificates/issue', {
        usuario_id: formData.usuario_id,
        modalidad: formData.modalidad,
        total_horas: formData.total_horas,
        fecha_emision: formData.fecha_emision,
        plantilla_modelo: formData.plantilla_modelo,
        desempeno_detalle: `en el área de ${formData.area}, ${formData.desempeno_detalle}`,
      });
      setSuccessMsg(`Certificado ${res.data?.certificate?.codigo_oficial || 'oficial'} emitido con éxito.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al emitir certificado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Emisor de Certificados Digitales Parametrizados</h2>
          <p className="text-xs text-slate-500">
            Completa el formulario en el panel izquierdo para actualizar la vista previa en vivo a la derecha
          </p>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full flex items-center space-x-1.5 w-fit">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Generación Vectorial PDF + QR SHA-256</span>
        </span>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario Izquierdo */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Parámetros de la Constancia
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Seleccionar Practicante o Trabajador *
              </label>
              <select
                value={formData.usuario_id}
                onChange={handleUserChange}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Elige un colaborador del directorio --</option>
                {collaborators.map((u) => {
                  const dniStr = String(u.dni || '');
                  const masked = dniStr.length >= 5 
                    ? `${dniStr.substring(0, 2)}***${dniStr.substring(dniStr.length - 3)}`
                    : dniStr;
                  return (
                    <option key={u.id ?? u._id} value={u.id ?? u._id}>
                      {u.nombres} {u.apellidos} ({u.tipo_usuario || 'Colaborador'} - DNI: {masked})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tipo de Certificación / Modalidad *
              </label>
              <select
                value={formData.modalidad}
                onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
              >
                <option value="Prácticas Preprofesionales">Prácticas Preprofesionales</option>
                <option value="Prácticas Profesionales">Prácticas Profesionales</option>
                <option value="Constancia Laboral">Constancia Laboral</option>
                <option value="Certificado de Reconocimiento">Certificado de Reconocimiento</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total de Horas *</label>
                <input
                  type="number"
                  value={formData.total_horas}
                  onChange={(e) => setFormData({ ...formData, total_horas: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha de Emisión *</label>
                <input
                  type="date"
                  value={formData.fecha_emision}
                  onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Selector de Plantilla */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Plantilla Institucional *</label>
              <select
                value={formData.plantilla_modelo}
                onChange={(e) => setFormData({ ...formData, plantilla_modelo: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="Plantilla Formal Elite (Borde Monumental + Guilloche + Circuitos)">
                  Opción 1: Formal Elite (Borde Monumental + Guilloche + Circuitos)
                </option>
                <option value="Plantilla Geométrica Tech (Polígonos + Red de Nodos)">
                  Opción 2: Geométrica Tech (Polígonos + Red de Nodos)
                </option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Observaciones / Mérito Convalidado</label>
              <textarea
                rows="3"
                value={formData.desempeno_detalle}
                onChange={(e) => setFormData({ ...formData, desempeno_detalle: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E56FF] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>{loading ? 'Generando...' : 'Emitir Certificado y Generar QR'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Se registrará automáticamente en la base de datos de producción
            </p>
          </form>
        </div>

        {/* Visor Derecho Formato A4 */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>VISTA PREVIA EN VIVO (FORMATO IMPRESIÓN A4)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Escala: 100% Vectorial</span>
          </div>

          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 sm:p-4 select-none">
            {/* Contenedor A4: margen horizontal y vertical óptimo */}
            <div className="relative w-full aspect-[1.414/1] bg-white border border-slate-100 px-14 py-8 sm:px-20 sm:py-10 flex flex-col justify-between overflow-hidden">
              
              {/* RENDER VECTORIAL SEGÚN PLANTILLA SELECCIONADA */}
              {formData.plantilla_modelo === 'Plantilla Geométrica Tech (Polígonos + Red de Nodos)' ? (
                /* OPCIÓN 2: GEOMÉTRICA TECH */
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 707" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="15" y="15" width="970" height="677" rx="2" stroke="#008DDA" strokeWidth="1" strokeOpacity="0.3" />
                  
                  {/* Polígonos Superior Izquierda */}
                  <path d="M0 0 L115 0 L0 115 Z" fill="#0B192C" />
                  <path d="M0 115 L115 0 L135 0 L0 135 Z" fill="#008DDA" />
                  <path d="M0 135 L135 0 L145 0 L0 145 Z" fill="#41C9E2" fillOpacity="0.8" />
                  
                  {/* Barras laterales */}
                  <g opacity="0.3" fill="#008DDA">
                    <rect x="10" y="210" width="3" height="20" rx="1.5" />
                    <rect x="18" y="195" width="3" height="35" rx="1.5" />
                    <rect x="26" y="180" width="3" height="55" rx="1.5" />
                  </g>

                  {/* Red de nodos */}
                  <g opacity="0.3" stroke="#008DDA" strokeWidth="1">
                    <line x1="30" y1="580" x2="65" y2="540" />
                    <line x1="65" y1="540" x2="100" y2="565" />
                    <circle cx="30" cy="580" r="2.5" fill="#008DDA" />
                    <circle cx="65" cy="540" r="2.5" fill="#008DDA" />
                    <circle cx="100" cy="565" r="2.5" fill="#008DDA" />
                  </g>

                  {/* Polígonos Inferior Izquierda */}
                  <path d="M0 707 L0 580 L95 707 Z" fill="#0B192C" />
                  <path d="M0 707 L95 707 L190 707 L0 645 Z" fill="#008DDA" />

                  {/* Circuitos superior derecha */}
                  <path d="M890 0 L940 50 L1000 50" stroke="#008DDA" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="890" cy="0" r="2.5" fill="#008DDA" />
                  <circle cx="1000" cy="50" r="2.5" fill="#008DDA" />

                  {/* Polígonos Superior Derecha */}
                  <path d="M1000 0 L885 0 L1000 115 Z" fill="#0B192C" />
                  <path d="M1000 115 L885 0 L870 0 L1000 130 Z" fill="#008DDA" />
                  
                  {/* Polígono Inferior Derecha */}
                  <path d="M1000 707 L890 707 L1000 595 Z" fill="#0B192C" />
                  <path d="M1000 707 L865 707 L1000 570 Z" fill="#008DDA" fillOpacity="0.4" />
                </svg>
              ) : (
                /* OPCIÓN 1: FORMAL ELITE MONUMENTAL CON GUILLOCHE */
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 707" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Guilloche / Roseta Ondulada de Seguridad */}
                  <g opacity="0.05" stroke="#0284C7" strokeWidth="0.8" fill="none">
                    <circle cx="500" cy="375" r="140" strokeDasharray="4 2" />
                    <circle cx="500" cy="375" r="170" />
                    <circle cx="500" cy="375" r="200" strokeDasharray="8 4" />
                    <ellipse cx="500" cy="375" rx="240" ry="150" transform="rotate(15 500 375)" />
                    <ellipse cx="500" cy="375" rx="240" ry="150" transform="rotate(-15 500 375)" />
                    <ellipse cx="500" cy="375" rx="240" ry="150" transform="rotate(45 500 375)" />
                    <ellipse cx="500" cy="375" rx="240" ry="150" transform="rotate(-45 500 375)" />
                  </g>

                  {/* Marcos Perimetrales */}
                  <rect x="15" y="15" width="970" height="677" rx="3" stroke="#0A1931" strokeWidth="6" />
                  <rect x="22" y="22" width="956" height="663" rx="2" stroke="#FFFFFF" strokeWidth="2.5" />
                  <rect x="28" y="28" width="944" height="651" rx="2" stroke="#0284C7" strokeWidth="2.5" />
                  <rect x="35" y="35" width="930" height="637" rx="2" stroke="#0A1931" strokeWidth="1" strokeOpacity="0.2" />

                  {/* Esquinas Biseladas Sólidas */}
                  <path d="M15 75 L75 15 L45 15 L15 45 Z" fill="#0A1931" />
                  <path d="M15 92 L92 15 L82 15 L15 82 Z" fill="#0284C7" />
                  <path d="M985 75 L925 15 L955 15 L985 45 Z" fill="#0A1931" />
                  <path d="M985 92 L908 15 L918 15 L985 82 Z" fill="#0284C7" />
                  <path d="M15 632 L75 692 L45 692 L15 662 Z" fill="#0A1931" />
                  <path d="M15 615 L92 692 L82 692 L15 625 Z" fill="#0284C7" />
                  <path d="M985 632 L925 692 L955 692 L985 662 Z" fill="#0A1931" />
                  <path d="M985 615 L908 692 L918 692 L985 625 Z" fill="#0284C7" />

                  {/* Circuitos perimetrales estrictamente pegados al borde */}
                  <path d="M15 115 L35 115 L48 102 L48 80" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="48" cy="80" r="2" fill="#0284C7" />
                  <path d="M115 15 L115 35 L102 48 L80 48" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="80" cy="48" r="2.5" fill="#0284C7" />

                  <path d="M985 115 L965 115 L952 102 L952 80" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="952" cy="80" r="2" fill="#0284C7" />
                  <path d="M885 15 L885 35 L898 48 L920 48" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="920" cy="48" r="2" fill="#0284C7" />

                  <path d="M15 592 L35 592 L48 605 L48 627" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="48" cy="627" r="2" fill="#0284C7" />
                  <path d="M115 692 L115 672 L102 659 L80 659" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="80" cy="659" r="2" fill="#0284C7" />

                  <path d="M985 592 L965 592 L952 605 L952 627" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="952" cy="627" r="2" fill="#0284C7" />
                  <path d="M885 692 L885 672 L898 659 L920 659" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="920" cy="659" r="2" fill="#0284C7" />

                  {/* Pistas Centrales Laterales del marco */}
                  <g stroke="#0284C7" strokeWidth="1.2" strokeLinecap="round">
                    <line x1="10" y1="300" x2="10" y2="405" strokeDasharray="5 3" />
                    <circle cx="10" cy="295" r="2" fill="#0284C7" />
                    <circle cx="10" cy="410" r="2" fill="#0284C7" />
                    <line x1="990" y1="300" x2="990" y2="405" strokeDasharray="5 3" />
                    <circle cx="990" cy="295" r="2" fill="#0284C7" />
                    <circle cx="990" cy="410" r="2" fill="#0284C7" />
                  </g>
                </svg>
              )}

              {/* 1. Cabecera Institucional (Bajada con pt-6 sm:pt-8 para quedar completamente limpia) */}
              <div className="relative z-10 flex justify-between items-start pt-6 sm:pt-8 px-2">
                <div className="text-left">
                  <h1 className="text-sm sm:text-base font-black text-[#0A1931] tracking-tight font-sans">
                    MATT INNOVA SOLUTION
                  </h1>
                  <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 font-mono">
                    E.I.R.L. • RUC: 20608934521
                  </p>
                </div>

                {/* Logotipo Oficial */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-1.5">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="50" r="22" stroke="#0284C7" strokeWidth="6" strokeDasharray="9 4" />
                      <path d="M22 50 C26 38, 40 38, 50 44 C60 38, 74 38, 78 50 C70 54, 60 50, 50 56 C40 50, 30 54, 22 50 Z" fill="#38BDF8" fillOpacity="0.4" stroke="#0284C7" strokeWidth="2" />
                      <text x="50" y="55" textAnchor="middle" fill="#0284C7" fontSize="13" fontWeight="900" fontFamily="sans-serif">mis</text>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-black text-[#0284C7] leading-none tracking-tight">
                        MATT INNOVA
                      </div>
                      <div className="text-[7.5px] font-extrabold text-[#0A1931] tracking-widest leading-none mt-0.5">
                        SOLUTION
                      </div>
                    </div>
                  </div>
                  <span className="text-[6px] font-bold text-slate-400 tracking-wider mt-0.5">
                    SOLUCIONES TI QUE TRANSFORMAN
                  </span>
                </div>
              </div>

              {/* 2. Cuerpo del Reconocimiento */}
              <div className="relative z-10 text-center my-auto space-y-2 px-2">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 tracking-[0.25em] uppercase font-sans">
                  OTORGA EL PRESENTE
                </p>

                <h2 
                  className="text-lg sm:text-2xl font-extrabold text-[#0A1931] tracking-wide uppercase"
                  style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
                >
                  CERTIFICADO DE RECONOCIMIENTO
                </h2>

                <p className="text-[10px] sm:text-[11px] text-slate-500 italic">
                  A favor de:
                </p>

                <div className="py-0.5">
                  <span 
                    className="text-2xl sm:text-4xl text-[#0A1931]"
                    style={{ fontFamily: "'Great Vibes', 'Alex Brush', cursive" }}
                  >
                    {formData.titularNombre || 'Alexandra Rojas'}
                  </span>
                </div>

                <p className="text-[9px] sm:text-[10px] text-slate-600 font-medium">
                  Identificado con DNI N° <span className="font-mono font-semibold">{formData.dniEnmascarado || '89***588'}</span>
                </p>

                <div className="max-w-lg mx-auto pt-1">
                  <p className="text-[9.5px] sm:text-[11px] text-slate-700 leading-relaxed">
                    Por haber culminado satisfactoriamente su periodo de{' '}
                    <strong className="text-slate-900 font-bold">{formData.modalidad}</strong> en el área de{' '}
                    <strong className="text-slate-900 font-bold">{formData.area || 'Ingeniería de Sistemas'}</strong>,{' '}
                    {formData.desempeno_detalle} Totalizando un récord convalidado de{' '}
                    <strong className="text-slate-900 font-bold">{formData.total_horas} horas cronológicas</strong>.
                  </p>
                </div>
              </div>

              {/* 3. Pie de Página (Firma, Fecha y QR) */}
              <div className="relative z-10 flex justify-between items-end pb-1 px-2">
                {/* Bloque Izquierdo: Firma centrada respecto a su línea + Fecha a la izquierda */}
                <div className="flex flex-col items-start space-y-1">
                  <div className="w-44 sm:w-48 flex flex-col items-center text-center">
                    <div className="w-full border-b border-dashed border-slate-400 mb-1"></div>
                    <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-900 leading-tight">
                      Ing. Representante Legal
                    </p>
                    <p className="text-[8px] sm:text-[8.5px] text-slate-500">
                      Matt Innova Solution E.I.R.L.
                    </p>
                  </div>
                  <p className="text-[7.5px] sm:text-[8px] text-slate-400 font-mono text-left pt-0.5">
                    Fecha de Emisión: {formData.fecha_emision}
                  </p>
                </div>

                {/* Bloque Derecho: Código QR y Sello Estilo Tech */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-white p-0.5 rounded border border-slate-300 shadow-xs">
                    {qrPreview ? (
                      <img src={qrPreview} alt="QR Live" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
                    ) : (
                      <div className="w-14 h-14 bg-slate-100 animate-pulse"></div>
                    )}
                  </div>
                  <div className="text-center font-mono text-[7.5px] sm:text-[8.5px] text-slate-700 leading-tight">
                    <span className="font-bold">CERT-2026-LIVE</span>
                    <p className="text-[6.5px] text-slate-400">Escanee para verificar</p>
                  </div>

                  {/* Badge Cápsula Celeste Tech */}
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#0284C7] text-white text-[7.5px] sm:text-[8px] font-bold shadow-xs">
                    <ShieldCheck className="w-3 h-3 text-white" />
                    <span>✓ VÁLIDO & FIRMADO DIGITALMENTE</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}