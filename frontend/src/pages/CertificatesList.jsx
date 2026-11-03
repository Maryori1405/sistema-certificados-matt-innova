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
    <div className="space-y-4">
      {/* Cabecera y Filtros exactamente con la estructura de tu captura */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Repositorio Central de Certificados Emitidos
          </h2>
          <p className="text-[11px] text-slate-400">
            Historial completo con opción de descarga de duplicados o anulación de documentos
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 text-[11px]">Filtrar estado:</span>
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
              statusFilter === 'todos'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('vigentes')}
            className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
              statusFilter === 'vigentes'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vigentes
          </button>
          <button
            onClick={() => setStatusFilter('revocados')}
            className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
              statusFilter === 'revocados'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revocados
          </button>
        </div>
      </div>

      {/* Tabla con el estilo original exacto */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-2">CÓDIGO OFICIAL</th>
              <th className="py-2.5 px-2">TITULAR DEL CERTIFICADO</th>
              <th className="py-2.5 px-2">TIPO / MODALIDAD</th>
              <th className="py-2.5 px-2">FECHA EMISIÓN</th>
              <th className="py-2.5 px-2">TOKEN QR SHA-256</th>
              <th className="py-2.5 px-2">ESTADO</th>
              <th className="py-2.5 px-2 text-right">ACCIONES ADMINISTRATIVAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">
                  Cargando certificados...
                </td>
              </tr>
            ) : filteredCerts.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">
                  No se encontraron certificados registrados.
                </td>
              </tr>
            ) : (
              filteredCerts.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-2 font-mono text-blue-600">
                    {cert.codigo_oficial}
                  </td>
                  <td className="py-3 px-2 font-medium text-slate-800">
                    {cert.titular}
                  </td>
                  <td className="py-3 px-2 text-slate-600">
                    {cert.modalidad}
                  </td>
                  <td className="py-3 px-2 text-slate-500 font-mono">
                    {cert.fecha_emision ? new Date(cert.fecha_emision).toLocaleDateString('es-PE') : '---'}
                  </td>
                  <td className="py-3 px-2 font-mono text-[10px] text-slate-500">
                    <span className="bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded">
                      {cert.token_sha256 
                        ? `${cert.token_sha256.substring(0, 8)}...${cert.token_sha256.substring(cert.token_sha256.length - 6)}` 
                        : '---'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] border ${
                      cert.estado === 'Vigente'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cert.estado === 'Vigente' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <span>{cert.estado}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => navigate(`/verificar/${cert.token_sha256 || cert.codigo_oficial}`)}
                        className="text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <QrCode className="w-3 h-3 text-slate-400" />
                        <span>Ver QR</span>
                      </button>

                      {cert.estado === 'Vigente' ? (
                        <>
                          <button
                            onClick={() => handleDownloadPdf(cert.id, cert.codigo_oficial)}
                            className="text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-slate-400" />
                            <span>Descargar PDF</span>
                          </button>
                          <button
                            onClick={() => handleOpenRevoke(cert)}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            Revocar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setCurrentReason(cert.motivo_revocacion || 'Sin motivo especificado.');
                            setViewReasonModal(true);
                          }}
                          className="text-slate-400 hover:text-slate-600 underline cursor-pointer"
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

      {/* MODAL DE REVOCACIÓN CON SELECCIÓN DE MOTIVOS Y CAMPO "OTRO" */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="font-bold text-xs text-slate-900">Anular / Revocar Certificado</h3>
              </div>
              <button 
                onClick={() => setShowRevokeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              Vas a revocar el certificado <strong className="font-mono">{selectedCert?.codigo_oficial}</strong> de <strong>{selectedCert?.titular}</strong>.
            </p>

            <form onSubmit={handleConfirmRevoke} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Motivo formal de anulación:
                </label>
                <select
                  value={reasonOption}
                  onChange={(e) => setReasonOption(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-[11px] text-slate-800 focus:outline-none focus:border-blue-500"
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
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Describe el motivo: *
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Escribe el motivo de la anulación..."
                    className="w-full p-2 rounded-lg border border-slate-300 text-[11px] focus:outline-none focus:border-blue-500 text-slate-700"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Revocando...' : 'Confirmar Revocación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VER EL MOTIVO DE ANULACIÓN */}
      {viewReasonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xs w-full p-4 shadow-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-800">
                Motivo de Revocación
              </h3>
              <button 
                onClick={() => setViewReasonModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 italic">
              "{currentReason}"
            </p>
            <div className="text-right">
              <button
                onClick={() => setViewReasonModal(false)}
                className="px-3 py-1 bg-slate-800 text-white rounded text-xs hover:bg-slate-900 cursor-pointer"
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