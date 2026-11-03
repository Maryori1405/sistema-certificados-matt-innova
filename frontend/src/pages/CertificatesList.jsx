import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Download, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function CertificateList() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('todos');

  // Estados para el Modal de Revocación
  const [selectedCert, setSelectedCert] = useState(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [reasonOption, setReasonOption] = useState('Error en los datos del titular (nombre o DNI)');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estados para ver el motivo de anulación
  const [viewReasonModal, setViewReasonModal] = useState(false);
  const [currentReason, setCurrentReason] = useState('');

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/certificates');
      const data = Array.isArray(res.data) ? res.data : (res.data.certificates || []);
      setCertificates(data);
    } catch (err) {
      console.error('Error al listar certificados:', err);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleOpenRevoke = (cert) => {
    setSelectedCert(cert);
    setReasonOption('Error en los datos del titular (nombre o DNI)');
    setCustomReason('');
    setShowRevokeModal(true);
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!selectedCert) return;

    const motivoFinal = reasonOption === 'Otro' ? customReason.trim() : reasonOption;

    if (!motivoFinal) {
      alert('Por favor especifica el motivo de la anulación.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.put(`/certificates/${selectedCert.id}/revoke`, {
        motivo_revocacion: motivoFinal,
      });

      setShowRevokeModal(false);
      setSelectedCert(null);
      fetchCertificates();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al revocar el certificado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (certId, codigo) => {
    try {
      const res = await axiosClient.get(`/certificates/${certId}/download`, { responseType: 'blob' });
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
      alert('Error al descargar el archivo PDF.');
    }
  };

  const filteredCerts = certificates.filter((item) => {
    if (statusFilter === 'todos') return true;
    if (statusFilter === 'vigentes') return item.estado === 'Vigente';
    if (statusFilter === 'revocados') return item.estado === 'Revocado';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 flex flex-col justify-between min-h-[calc(100vh-8rem)]">
      <div className="space-y-6">
        {/* Cabecera y Selector de Filtros idénticos a la imagen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Repositorio Central de Certificados Emitidos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historial completo con opción de descarga de duplicados o anulación de documentos
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Filtrar estado:</span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'todos'
                    ? 'bg-[#1E56FF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('vigentes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'vigentes'
                    ? 'bg-[#1E56FF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Vigentes
              </button>
              <button
                onClick={() => setStatusFilter('revocados')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'revocados'
                    ? 'bg-[#1E56FF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Revocados
              </button>
            </div>
          </div>
        </div>

        {/* Tabla idéntica a la imagen */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3">CÓDIGO OFICIAL</th>
                <th className="py-3.5 px-3">TITULAR DEL CERTIFICADO</th>
                <th className="py-3.5 px-3">TIPO / MODALIDAD</th>
                <th className="py-3.5 px-3">FECHA EMISIÓN</th>
                <th className="py-3.5 px-3">TOKEN QR SHA-256</th>
                <th className="py-3.5 px-3 text-center">ESTADO</th>
                <th className="py-3.5 px-3 text-right">ACCIONES ADMINISTRATIVAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Cargando certificados...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No se encontraron certificados registrados.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Código oficial en azul */}
                    <td className="py-3 px-3 font-mono font-semibold text-[#1E56FF]">
                      {cert.codigo_oficial}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {cert.titular}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {cert.modalidad}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">
                      {cert.fecha_emision ? new Date(cert.fecha_emision).toLocaleDateString('es-PE') : '---'}
                    </td>
                    {/* Token plano con estilo monospace */}
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {cert.token_sha256 
                        ? `${cert.token_sha256.substring(0, 8)}...${cert.token_sha256.substring(cert.token_sha256.length - 4)}` 
                        : '---'}
                    </td>
                    {/* Badge de estado con fondo suave */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                        cert.estado === 'Vigente'
                          ? 'bg-[#EBFBF2] text-[#059669] border-[#A7F3D0]'
                          : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cert.estado === 'Vigente' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></span>
                        <span>{cert.estado}</span>
                      </span>
                    </td>
                    {/* Acciones con cajas redondeadas independientes */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/verificar/${cert.token_sha256 || cert.codigo_oficial}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium inline-flex items-center space-x-1 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver QR</span>
                        </button>

                        {cert.estado === 'Vigente' ? (
                          <>
                            <button
                              onClick={() => handleDownloadPdf(cert.id, cert.codigo_oficial)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium inline-flex items-center space-x-1 transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                              <span>Descargar PDF</span>
                            </button>
                            <button
                              onClick={() => handleOpenRevoke(cert)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md text-xs font-medium transition cursor-pointer"
                            >
                              Revocar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setCurrentReason(cert.motivo_revocacion || 'Sin motivo especificado al momento de la anulación.');
                              setViewReasonModal(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition cursor-pointer"
                          >
                            Ver Motivo Anulación
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pie de página con el aviso de advertencia idéntico a la imagen */}
      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-1.5 text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Toda revocación inhabilita de inmediato el acceso al estado verde en el escaneo móvil por código QR.</span>
        </div>
        <span className="text-slate-400">Servidor en Producción: Render Cloud</span>
      </div>

      {/* MODAL DE REVOCACIÓN CON SELECCIÓN DE MOTIVOS Y CAMPO OTRO */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">Anular / Revocar Certificado</h3>
              </div>
              <button 
                onClick={() => setShowRevokeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200/70 p-3 rounded-xl text-xs text-rose-800 leading-relaxed">
              Vas a anular el certificado <strong className="font-mono">{selectedCert?.codigo_oficial}</strong> de <strong>{selectedCert?.titular}</strong>. Esta acción quedará registrada en auditoría pública.
            </div>

            <form onSubmit={handleConfirmRevoke} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Selecciona el motivo formal de anulación:
                </label>
                <select
                  value={reasonOption}
                  onChange={(e) => setReasonOption(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                >
                  <option value="Error en los datos del titular (nombre o DNI)">
                    Error en los datos del titular (nombre o DNI)
                  </option>
                  <option value="Inconsistencia en el número de horas acumuladas">
                    Inconsistencia en el número de horas acumuladas
                  </option>
                  <option value="Corrección en el tipo de modalidad o área asignada">
                    Corrección en el tipo de modalidad o área asignada
                  </option>
                  <option value="Documento emitido por duplicidad involuntaria">
                    Documento emitido por duplicidad involuntaria
                  </option>
                  <option value="Incumplimiento de requisitos institucionales">
                    Incumplimiento de requisitos institucionales
                  </option>
                  <option value="Otro">
                    Otro (especificar motivo detallado)
                  </option>
                </select>
              </div>

              {reasonOption === 'Otro' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Describe detalladamente el motivo de anulación: *
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Escribe aquí el motivo específico por el cual se revoca el documento..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-500 text-slate-700"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Revocando...' : 'Confirmar Revocación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VER MOTIVO DE ANULACIÓN */}
      {viewReasonModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Motivo de Revocación Registrado
              </h3>
              <button 
                onClick={() => setViewReasonModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 italic leading-relaxed">
              "{currentReason}"
            </p>
            <div className="text-right">
              <button
                onClick={() => setViewReasonModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}