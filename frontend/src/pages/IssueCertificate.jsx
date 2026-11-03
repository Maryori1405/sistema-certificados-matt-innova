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

  // 2. Generar QR para la vista previa dinámico
  useEffect(() => {
    const identificador = formData.usuario_id || 'CERT-2026-LIVE';
    const baseOrigin = window.location.origin;
    const previewUrl = `${baseOrigin}/verificar/${identificador}`;

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

  const esOpcion2 = formData.plantilla_modelo.includes('Geométrica') || formData.plantilla_modelo.includes('2');

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
                  Opción 1: Formal Elite (Borde Monumental + Circuitos)
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
            <div className="relative w-full aspect-[1.414/1] bg-white border border-slate-100 flex flex-col justify-between overflow-hidden px-8 py-6 sm:px-12 sm:py-8">
              
              {/* RENDER MARCO SEGÚN PLANTILLA */}
              {esOpcion2 ? (
                /* OPCIÓN 2: GEOMÉTRICA TECH (IMAGEN 2) */
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 707" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Marco perimetral fino */}
                  <rect x="20" y="20" width="960" height="667" stroke="#008DDA" strokeWidth="1" strokeOpacity="0.35" />

                  {/* Esquina Superior Izquierda */}
                  <path d="M0 0 L150 0 L0 150 Z" fill="#0B192C" />
                  <path d="M0 150 L150 0 L170 0 L0 170 Z" fill="#008DDA" />
                  
                  {/* Esquina Superior Derecha */}
                  <path d="M1000 0 L850 0 L1000 150 Z" fill="#0B192C" />
                  <path d="M1000 150 L850 0 L830 0 L1000 170 Z" fill="#008DDA" />

                  {/* Esquina Inferior Izquierda */}
                  <path d="M0 707 L0 557 L150 707 Z" fill="#0B192C" />
                  <path d="M0 557 L150 707 L170 707 L0 537 Z" fill="#008DDA" />

                  {/* Esquina Inferior Derecha */}
                  <path d="M1000 707 L1000 557 L850 707 Z" fill="#0B192C" />
                  <path d="M1000 557 L850 707 L830 707 L1000 537 Z" fill="#008DDA" />

                  {/* Barras verticales izquierdas */}
                  <g fill="#008DDA" opacity="0.4">
                    <rect x="45" y="320" width="3" height="45" rx="1.5" />
                    <rect x="52" y="300" width="3" height="65" rx="1.5" />
                    <rect x="59" y="335" width="3" height="30" rx="1.5" />
                  </g>

                  {/* Red de nodos inferior izquierda */}
                  <g stroke="#008DDA" strokeWidth="1.2" opacity="0.45" fill="none">
                    <line x1="55" y1="550" x2="115" y2="520" />
                    <line x1="115" y1="520" x2="125" y2="540" />
                    <line x1="55" y1="550" x2="85" y2="570" />
                    <line x1="85" y1="570" x2="125" y2="540" />
                    <circle cx="55" cy="550" r="3" fill="#008DDA" />
                    <circle cx="115" cy="520" r="3" fill="#008DDA" />
                    <circle cx="125" cy="540" r="3" fill="#008DDA" />
                    <circle cx="85" cy="570" r="3" fill="#008DDA" />
                  </g>
                </svg>
              ) : (
                /* OPCIÓN 1: FORMAL ELITE MONUMENTAL (IMAGEN 1) */
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 707" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Marcos Perimetrales */}
                  <rect x="15" y="15" width="970" height="677" rx="3" stroke="#0A1931" strokeWidth="5.5" />
                  <rect x="22" y="22" width="956" height="663" rx="2" stroke="#FFFFFF" strokeWidth="2.5" />
                  <rect x="27" y="27" width="946" height="653" rx="2" stroke="#0284C7" strokeWidth="2" />
                  <rect x="33" y="33" width="934" height="641" rx="2" stroke="#0A1931" strokeWidth="0.8" strokeOpacity="0.25" />

                  {/* Esquinas Biseladas Sólidas */}
                  <path d="M15 75 L75 15 L45 15 L15 45 Z" fill="#0A1931" />
                  <path d="M15 92 L92 15 L82 15 L15 82 Z" fill="#0284C7" />
                  <path d="M985 75 L925 15 L955 15 L985 45 Z" fill="#0A1931" />
                  <path d="M985 92 L908 15 L918 15 L985 82 Z" fill="#0284C7" />
                  <path d="M15 632 L75 692 L45 692 L15 662 Z" fill="#0A1931" />
                  <path d="M15 615 L92 692 L82 692 L15 625 Z" fill="#0284C7" />
                  <path d="M985 632 L925 692 L955 692 L985 662 Z" fill="#0A1931" />
                  <path d="M985 615 L908 692 L918 692 L985 625 Z" fill="#0284C7" />

                  {/* Circuitos perimetrales en esquinas */}
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

                  {/* Pistas Centrales Laterales punteadas */}
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

              {/* 1. Cabecera con Logo Centrado */}
              <div className="relative z-10 flex flex-col items-center justify-center pt-2">
                <img 
                  src="/logo.png" 
                  alt="Logo Matt Innova Solution" 
                  className="h-16 sm:h-20 w-auto max-w-[280px] object-contain drop-shadow-sm" 
                />
              </div>

              {/* 2. Cuerpo del Reconocimiento */}
              <div className="relative z-10 text-center my-auto space-y-2 px-4">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 tracking-[0.25em] uppercase font-sans">
                  OTORGA EL PRESENTE
                </p>

                <h2 
                  className="text-lg sm:text-2xl font-black text-[#0A1931] tracking-wider uppercase"
                  style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
                >
                  CERTIFICADO DE RECONOCIMIENTO
                </h2>

                <p className="text-[10px] sm:text-[11px] text-slate-500 italic">
                  A favor de:
                </p>

                <div className="py-1">
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

                <div className="max-w-xl mx-auto pt-1">
                  <p className="text-[9.5px] sm:text-[11px] text-slate-700 leading-relaxed">
                    Por haber culminado satisfactoriamente su periodo de{' '}
                    <strong className="text-slate-900 font-bold">{formData.modalidad}</strong> en el área de{' '}
                    <strong className="text-slate-900 font-bold">{formData.area || 'Ingeniería de Sistemas'}</strong>,{' '}
                    {formData.desempeno_detalle} Totalizando un récord convalidado de{' '}
                    <strong className="text-slate-900 font-bold">{formData.total_horas} horas cronológicas</strong>.
                  </p>
                </div>
              </div>

              {/* 3. Pie de Página */}
              <div className="relative z-10 flex justify-between items-end pb-2 px-4 sm:px-6">
                {/* Firma y Fecha */}
                <div className="flex flex-col items-start space-y-1">
                  <div className="w-44 sm:w-52 flex flex-col items-center text-center">
                    <div className="w-full border-b border-dashed border-slate-400 mb-1"></div>
                    <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-900 leading-tight">
                      Ing. Representante Legal
                    </p>
                    <p className="text-[8px] sm:text-[8.5px] text-slate-500">
                      Matt Innova Solution E.I.R.L.
                    </p>
                  </div>
                  <p className="text-[7.5px] sm:text-[8px] text-slate-400 font-mono text-left pt-1">
                    Fecha de Emisión: {formData.fecha_emision}
                  </p>
                </div>

                {/* QR y Badge */}
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

                  {/* Píldora Celeste Tech */}
                  <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-[#0284C7] text-white text-[7.5px] sm:text-[8px] font-bold shadow-xs">
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