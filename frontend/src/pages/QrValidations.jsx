// frontend/src/pages/QrValidations.jsx
import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  RefreshCw,
  Globe,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function QrValidations() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/certificates');
      const data = Array.isArray(res.data) ? res.data : (res.data.certificates || []);
      setLogs(data);
    } catch (err) {
      console.error('Error al cargar bitácora de validaciones QR:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((item) => {
    const term = filterText.toLowerCase();
    const matchesText = 
      (item.codigo_oficial && item.codigo_oficial.toLowerCase().includes(term)) ||
      (item.titular && item.titular.toLowerCase().includes(term)) ||
      (item.token_sha256 && item.token_sha256.toLowerCase().includes(term));

    if (statusFilter === 'todos') return matchesText;
    if (statusFilter === 'vigentes') return matchesText && item.estado === 'Vigente';
    if (statusFilter === 'revocados') return matchesText && item.estado === 'Revocado';
    return matchesText;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Auditoría de Validaciones QR & Hash SHA-256</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de trazabilidad y verificación criptográfica de certificados consultados públicamente
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código, titular o hash..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 w-64 bg-slate-50/50"
            />
          </div>

          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Actualizar registro"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Tokens Criptográficos Registrados</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{logs.length}</h3>
          </div>
          <ShieldCheck className="w-7 h-7 text-blue-600 opacity-80" />
        </div>

        <div className="p-4 rounded-xl border border-slate-100 bg-emerald-50/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-700">Validaciones en Estado Vigente</p>
            <h3 className="text-lg font-bold text-emerald-900 mt-1">
              {logs.filter(l => l.estado === 'Vigente').length}
            </h3>
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
        </div>

        <div className="p-4 rounded-xl border border-slate-100 bg-rose-50/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-rose-700">Certificados Revocados / Invalidados</p>
            <h3 className="text-lg font-bold text-rose-900 mt-1">
              {logs.filter(l => l.estado === 'Revocado').length}
            </h3>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-600 opacity-80" />
        </div>
      </div>

      {/* Selector de estado */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-slate-500 font-medium">Filtrar por condición del enlace:</span>
        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              statusFilter === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({logs.length})
          </button>
          <button
            onClick={() => setStatusFilter('vigentes')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              statusFilter === 'vigentes' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vigentes
          </button>
          <button
            onClick={() => setStatusFilter('revocados')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              statusFilter === 'revocados' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revocados
          </button>
        </div>
      </div>

      {/* Tabla de Auditoría */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4">Código Oficial</th>
              <th className="py-3 px-4">Titular del Certificado</th>
              <th className="py-3 px-4">Hash Criptográfico (SHA-256)</th>
              <th className="py-3 px-4">Fecha Emisión</th>
              <th className="py-3 px-4">Estado QR</th>
              <th className="py-3 px-4 text-right">Comprobación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando bitácora de validación criptográfica...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                  No se encontraron registros de validaciones con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredLogs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">
                    {item.codigo_oficial}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {item.titular}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500" title={item.token_sha256}>
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                      {item.token_sha256 
                        ? `${item.token_sha256.substring(0, 10)}...${item.token_sha256.substring(item.token_sha256.length - 8)}` 
                        : 'No generado'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.fecha_emision ? new Date(item.fecha_emision).toLocaleDateString('es-PE') : '---'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${
                      item.estado === 'Vigente'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.estado === 'Vigente' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <span>{item.estado === 'Vigente' ? 'QR Activo / Válido' : 'QR Revocado'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate(`/verificar/${item.token_sha256 || item.codigo_oficial}`)}
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline cursor-pointer"
                    >
                      <span>Simular Escaneo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>Protegido con estándar criptográfico SHA-256 e IP anónima bajo directivas institucionales.</span>
        </div>
        <span>Total: <strong>{filteredLogs.length}</strong> registros verificables</span>
      </div>
    </div>
  );
}