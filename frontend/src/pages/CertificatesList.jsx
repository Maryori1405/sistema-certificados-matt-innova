// frontend/src/pages/CertificatesList.jsx
import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, QrCode, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function CertificatesList() {
  const navigate = useNavigate();
  const [filterState, setFilterState] = useState('Todos');
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const url = filterState === 'Todos' ? '/certificates' : `/certificates?estado=${filterState}`;
      const res = await axiosClient.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data.certificates || []);
      setCerts(data);
    } catch (err) {
      console.error('Error cargando certificados:', err);
      setCerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [filterState]);

  const handleDownloadPdf = async (certificateId, codigoOficial) => {
    setDownloadingId(certificateId);
    try {
      const response = await axiosClient.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Certificado_${codigoOficial || certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      alert(error.response?.data?.message || 'No se pudo generar o descargar el PDF del servidor.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRevoke = async (id) => {
    const motivo = prompt('Ingrese el motivo formal de anulación/revocación:');
    if (!motivo) return;

    try {
      await axiosClient.put(`/certificates/${id}/revoke`, { motivo });
      alert('Certificado revocado exitosamente.');
      fetchCertificates();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al revocar certificado.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Repositorio Central de Certificados Emitidos</h2>
          <p className="text-xs text-slate-500">Historial completo con opción de descarga de duplicados o anulación de documentos</p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-medium">Filtrar estado:</span>
          {['Todos', 'Vigente', 'Revocado'].map((state) => {
            const isSelected = filterState === state;
            return (
              <button
                key={state}
                onClick={() => setFilterState(state)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  isSelected 
                    ? 'bg-[#1E56FF] text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {state === 'Todos' ? 'Todos' : state === 'Vigente' ? 'Vigentes' : 'Revocados'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla Central */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4">CÓDIGO OFICIAL</th>
              <th className="py-3 px-4">TITULAR DEL CERTIFICADO</th>
              <th className="py-3 px-4">TIPO / MODALIDAD</th>
              <th className="py-3 px-4">FECHA EMISIÓN</th>
              <th className="py-3 px-4">TOKEN QR SHA-256</th>
              <th className="py-3 px-4">ESTADO</th>
              <th className="py-3 px-4 text-right">ACCIONES ADMINISTRATIVAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-slate-400">Consultando certificados en servidor...</td>
              </tr>
            ) : certs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-slate-400">No hay certificados en este estado.</td>
              </tr>
            ) : (
              certs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-blue-600 font-mono">{item.codigo_oficial}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{item.titular}</td>
                  <td className="py-3.5 px-4 text-slate-600">{item.modalidad}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {item.fecha_emision ? new Date(item.fecha_emision).toLocaleDateString('es-PE') : '---'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500" title={item.token_sha256}>
                    {item.token_sha256 
                      ? `${item.token_sha256.substring(0, 8)}...${item.token_sha256.substring(item.token_sha256.length - 4)}` 
                      : '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${
                      item.estado === 'Vigente' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.estado === 'Vigente' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <span>{item.estado}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Enlace de comprobación pública */}
                      <button
                        onClick={() => navigate(`/verificar/${item.token_sha256 || item.codigo_oficial}`)}
                        className="text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded font-medium inline-flex items-center space-x-1 transition cursor-pointer"
                        title="Ver comprobación pública"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Ver QR</span>
                      </button>

                      {item.estado === 'Vigente' ? (
                        <>
                          <button
                            onClick={() => handleDownloadPdf(item.id, item.codigo_oficial)}
                            disabled={downloadingId === item.id}
                            className="text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded font-medium inline-flex items-center space-x-1 transition disabled:opacity-50 cursor-pointer"
                          >
                            {downloadingId === item.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Descargando...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Descargar PDF</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRevoke(item.id)}
                            className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2.5 py-1 rounded font-medium transition cursor-pointer"
                          >
                            Revocar
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => alert(`Motivo de anulación formal:\n${item.motivo_revocacion || 'Sin motivo especificado'}`)}
                          className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded font-medium transition cursor-pointer"
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

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
        <span className="flex items-center space-x-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Toda revocación inhabilita de inmediato el acceso al estado verde en el escaneo móvil por código QR.</span>
        </span>
        <span>Servidor en Producción: Render Cloud</span>
      </div>
    </div>
  );
}