// frontend/src/components/layout/AppLayout.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  FileText, 
  QrCode, 
  Settings, 
  LogOut 
} from 'lucide-react';

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token_session');
    localStorage.removeItem('user_data');
    navigate('/login');
  };

  const navItems = [
    { label: 'Panel de Control', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Colaboradores', path: '/admin/colaboradores', icon: Users, badge: '82' },
    { label: 'Emitir Certificado', path: '/admin/emitir', icon: PlusCircle },
    { label: 'Lista de Certificados', path: '/admin/certificados', icon: FileText },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-[#0C1322] flex flex-col justify-between text-slate-300 border-r border-slate-800 shrink-0">
        <div>
          {/* Logo Empresa Oficial - Centrado y Ampliado */}
          <div className="pt-6 pb-5 px-4 flex flex-col items-center justify-center border-b border-slate-800/60">
            <div className="w-full flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Matt Innova Solution" 
                className="w-auto max-w-[205px] max-h-16 object-contain filter drop-shadow-md mx-auto" 
              />
            </div>
            <span className="text-[10px] font-mono tracking-wider text-blue-400 font-semibold uppercase mt-3 text-center">
              Sistema de Certificados
            </span>
          </div>

          {/* Menú */}
          <div className="px-3 py-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
              Gestión Principal
            </span>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#1E56FF] text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-slate-800 text-[10px] text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2 block">
              Sistema y Auditoría
            </span>
            <div className="space-y-1">
              <button 
                onClick={() => navigate('/admin/validaciones-qr')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-left"
              >
                <div className="flex items-center space-x-3">
                  <QrCode className="w-4 h-4 text-slate-400" />
                  <span>Validaciones QR</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </button>
              <button 
                onClick={() => navigate('/admin/configuracion')}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-left"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Configuración</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800/60">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-xs text-rose-400 hover:text-rose-300 transition-colors w-full px-3 py-2 rounded-lg hover:bg-rose-500/10 font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-end space-x-4 shrink-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-700 text-white font-semibold rounded-full flex items-center justify-center text-xs shadow-sm">
              AR
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">
                {userData.nombreCompleto || 'Alejandro Daniel Rivas Castillo'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Administrador</p>
            </div>
          </div>
        </header>

        <main className="p-8 flex-1 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}