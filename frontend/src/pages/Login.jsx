// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function Login() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/auth/login', {
        correo_institucional: correo,
        password: password,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('token_session', res.data.token);
      localStorage.setItem('user_data', JSON.stringify(res.data.user));

      if (res.data.user?.tipo_usuario === 'Administrador') {
        navigate('/admin/dashboard');
      } else {
        navigate('/portal-practicante');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setErrorMsg(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 max-w-sm w-full space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-xl shadow-md">
            M
          </div>
          <h2 className="text-sm font-bold text-slate-900 mt-3 tracking-wide">MATT INNOVA SOLUTION</h2>
          <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Sistema de Certificados Digitales</p>
          <h1 className="text-lg font-bold text-slate-800 mt-4">Bienvenido de nuevo</h1>
          <p className="text-xs text-slate-400">Ingresa tus credenciales para acceder al panel administrativo</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico Institucional</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="admin@mattinnova.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-medium bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Contraseña de Acceso</label>
              <Link
                to="/recuperar-password"
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-medium bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
              <span>Recordar sesión (20 min)</span>
            </label>
            <span className="text-emerald-600 font-medium flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Conexión HTTPS SSL</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E56FF] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión →'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ¿Eres practicante o colaborador?{' '}
            <Link to="/portal-practicante" className="text-blue-600 font-semibold hover:underline">
              Consulta tus certificados aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}