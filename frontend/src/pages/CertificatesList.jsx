// frontend/src/pages/CertificateList.jsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  QrCode, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  RefreshCw 
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

  // Abrir el modal de revocación
  const handleOpenRevoke = (cert) => {
    setSelectedCert(cert);
    setReasonOption('Error en los datos del titular (nombre o DNI)');
    setCustomReason('');
    setShowRevokeModal(true);
  };

  // Confirmar la revocación
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

  // Descarga del PDF
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
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Repositorio Central de Certificados Emitidos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial completo con opción de descarga de duplicados o anulación de documentos
          </p>
        </div>

        {/* Filtros de Estado */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-medium">Filtrar estado:</span>
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'todos' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('vigentes')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'vigentes' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vigentes
            </button>
            <button
              onClick={() => setStatusFilter('revocados')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'revocados' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revocados
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Certificados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4">Código Oficial</th>
              <th className="py-3 px-4">Titular del Certificado</th>
              <th className="py-3 px-4">Tipo / Modalidad</th>
              <th className="py-3 px-4">Fecha Emisión</th>
              <th className="py-3 px-4">Token QR SHA-256</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones Administrativas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando certificados...</span>
                  </div>
                </td>
              </tr>
            ) : filteredCerts.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                  No se encontraron certificados registrados.
                </td>
              </tr>
            ) : (
              filteredCerts.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-blue-600 font-mono">
                    {cert.codigo_oficial}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {cert.titular}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {cert.modalidad}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {cert.fecha_emision ? new Date(cert.fecha_emision).toLocaleDateString('es-PE') : '---'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {cert.token_sha256 ? `${cert.token_sha256.substring(0, 8)}...${cert.token_sha256.substring(cert.token_sha256.length - 6)}` : '---'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${
                      cert.estado === 'Vigente'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cert.estado === 'Vigente' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <span>{cert.estado}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => navigate(`/verificar/${cert.token_sha256 || cert.codigo_oficial}`)}
                        className="text-slate-600 hover:text-blue-600 inline-flex items-center space-x-1 cursor-pointer"
                        title="Ver validación QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Ver QR</span>
                      </button>

                      {cert.estado === 'Vigente' ? (
                        <>
                          <button
                            onClick={() => handleDownloadPdf(cert.id, cert.codigo_oficial)}
                            className="text-slate-600 hover:text-blue-600 inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar PDF</span>
                          </button>
                          <button
                            onClick={() => handleOpenRevoke(cert)}
                            className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
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
                          className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
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

      {/* MODAL DE REVOCACIÓN CON LISTA DESPLEGABLE Y OPCIÓN "OTRO" */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
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

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs text-rose-800">
              Vas a revocar el certificado oficial <strong className="font-mono">{selectedCert?.codigo_oficial}</strong> perteneciente a <strong>{selectedCert?.titular}</strong>.
            </div>

            <form onSubmit={handleConfirmRevoke} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Selecciona el motivo formal de anulación:
                </label>
                <select
                  value={reasonOption}
                  onChange={(e) => setReasonOption(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
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

              {/* Si seleccionó "Otro", se habilita el textarea para redactar el motivo */}
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
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-700"
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

      {/* MODAL PARA VER EL MOTIVO DE ANULACIÓN REGISTRADO */}
      {viewReasonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3">
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