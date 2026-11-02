// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  CheckCircle2, 
  QrCode, 
  Plus, 
  ExternalLink 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    metricas: {
      total_emitidos: 0,
      colaboradores_total: 0,
      desglose_colaboradores: { practicantes: 0, trabajadores: 0 },
      certificados_vigentes: 0,
      consultas_qr_totales: 0
    },
    acreditaciones_recientes: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get('/admin/dashboard-stats');
        setData(res.data);
      } catch (err) {
        console.error('Error cargando métricas:', err);
      }
    };
    fetchStats();
  }, []);

  // Enmascaramiento de DNI conforme a Ley 29733
  const formatDni = (dni) => {
    if (!dni) return '---';
    const str = String(dni).trim();
    if (str.includes('*')) return str;
    if (str.length >= 8) {
      return `${str.substring(0, 2)}***${str.substring(str.length - 3)}`;
    }
    return str;
  };

  // Manejo de navegación segura hacia la vista pública del QR
  const handleNavigateVerify = (item) => {
    // 1. Busca el token criptográfico real
    const token = item.token_sha256 || item.token_qr || item.token || item.qr_token || item.hash;
    
    if (token && token !== 'undefined') {
      navigate(`/verificar/${token}`);
      return;
    }

    // 2. Si no vino el token en el registro, navega por su código oficial o id
    if (item.codigo_oficial) {
      navigate(`/verificar/${item.codigo_oficial}`);
      return;
    }

    if (item.id) {
      navigate(`/verificar/${item.id}`);
      return;
    }

    alert('No se pudo obtener el identificador de validación del certificado.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Panel de Control / Dashboard</h2>
          <p className="text-xs text-slate-500">Métricas consolidadas de emisión y validaciones en tiempo real</p>
        </div>
        <button
          onClick={() => navigate('/admin/emitir')}
          className="bg-[#1E56FF] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Certificado</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emitidos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Emitidos</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.metricas.total_emitidos}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center">
                ↑ +12 en el presente mes
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
        </div>

        {/* Colaboradores */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Colaboradores</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.metricas.colaboradores_total}</h3>
              <p className="text-[11px] text-slate-500 mt-2">
                {data.metricas.desglose_colaboradores?.practicantes || 0} practicantes • {data.metricas.desglose_colaboradores?.trabajadores || 0} trabajadores
              </p>
            </div>
            <div className="p-2.5 bg-teal-50 rounded-lg border border-teal-100">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>
        </div>

        {/* Certificados Vigentes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Certificados Vigentes</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.metricas.certificados_vigentes}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-2">
                {data.metricas.total_emitidos > 0 
                  ? ((data.metricas.certificados_vigentes / data.metricas.total_emitidos) * 100).toFixed(1) 
                  : 100}% con validación QR activa
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Consultas QR */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Consultas QR Totales</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.metricas.consultas_qr_totales?.toLocaleString() || 0}</h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-2">
                Verificaciones públicas externas
              </p>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
              <QrCode className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Acreditaciones y Certificados Recientes</h3>
            <p className="text-[11px] text-slate-500">Control cronológico y estado de tokens criptográficos</p>
          </div>
          <button
            onClick={() => navigate('/admin/certificados')}
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center space-x-1"
          >
            <span>Ver todos los certificados</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Código</th>
                <th className="py-3 px-5">Titular</th>
                <th className="py-3 px-5">DNI</th>
                <th className="py-3 px-5">Modalidad</th>
                <th className="py-3 px-5">Fecha</th>
                <th className="py-3 px-5">Estado</th>
                <th className="py-3 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.acreditaciones_recientes.map((item) => {
                const isVigente = item.estado === 'Vigente';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-blue-600">{item.codigo_oficial}</td>
                    <td className="py-3.5 px-5 font-medium text-slate-900">{item.titular}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono">{formatDni(item.dni)}</td>
                    <td className="py-3.5 px-5 text-slate-600">{item.modalidad}</td>
                    <td className="py-3.5 px-5 text-slate-500">{new Date(item.fecha_emision).toLocaleDateString('es-PE')}</td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${
                          isVigente
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isVigente ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        ></span>
                        <span>{item.estado}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleNavigateVerify(item)}
                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center space-x-1"
                      >
                        <span>Ver QR / Detalle</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}