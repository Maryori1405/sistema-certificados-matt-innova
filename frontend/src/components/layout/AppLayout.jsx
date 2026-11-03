// frontend/src/components/layout/AppLayout.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  FileText, 
  QrCode, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token_session');
    localStorage.removeItem('user_data');
    navigate('/login');
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const navItemsPrincipal = [
    { label: 'Panel de Control', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Colaboradores', path: '/admin/colaboradores', icon: Users, badge: '82' },
    { label: 'Emitir Certificado', path: '/admin/emitir', icon: PlusCircle },
    { label: 'Lista de Certificados', path: '/admin/certificados', icon: FileText },
  ];

  const navItemsSistema = [
    { label: 'Validaciones QR', path: '/admin/validaciones-qr', icon: QrCode, hasStatusDot: true },
    { label: 'Configuración', path: '/admin/configuracion', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden relative">
      {/* Fondo oscuro para móvil al abrir el sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Lateral Responsivo */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0C1322] flex flex-col justify-between text-slate-300 border-r border-slate-800 shrink-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Empresa Oficial con botón de cierre móvil */}
          <div className="pt-6 pb-5 px-4 flex flex-col items-center justify-center border-b border-slate-800/60 relative">
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>

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
            {/* Sección: Gestión Principal */}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
              Gestión Principal
            </span>
            <nav className="space-y-1">
              {navItemsPrincipal.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebarOnMobile}
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

            {/* Sección: Sistema y Auditoría */}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2 block">
              Sistema y Auditoría
            </span>
            <nav className="space-y-1">
              {navItemsSistema.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebarOnMobile}
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
                    {item.hasStatusDot && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800/60">
          <button
            onClick={() => {
              closeSidebarOnMobile();
              handleLogout();
            }}
            className="flex items-center space-x-3 text-xs text-rose-400 hover:text-rose-300 transition-colors w-full px-3 py-2 rounded-lg hover:bg-rose-500/10 font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-xs">
          {/* Botón Hamburguesa Móvil */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Perfil de Usuario */}
          <div className="flex items-center space-x-3 ml-auto">
            <div className="w-9 h-9 bg-blue-700 text-white font-semibold rounded-full flex items-center justify-center text-xs shadow-xs">
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

        <main className="p-4 sm:p-8 flex-1 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}