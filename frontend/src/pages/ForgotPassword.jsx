// frontend/src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Paso 1: Ingreso de DNI / Correo
  // Paso 2: Responder pregunta y establecer nueva contraseña
  const [step, setStep] = useState(1);

  const [identificador, setIdentificador] = useState('');
  const [userData, setUserData] = useState(null); // { userId, correo, pregunta }

  const [respuesta, setRespuesta] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Paso 1: Consultar la pregunta de seguridad asignada en PostgreSQL
  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    if (!identificador.trim()) {
      setMsg({ type: 'error', text: 'Ingresa tu DNI o Correo Institucional.' });
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await axiosClient.post('/auth/recuperar/pregunta', { identificador });
      setUserData(res.data);
      setStep(2);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'No se encontró un usuario con ese DNI o correo.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Validar respuesta y guardar la nueva contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!respuesta.trim()) {
      setMsg({ type: 'error', text: 'Por favor responde a tu pregunta de seguridad.' });
      return;
    }

    if (nuevaPassword.length < 6) {
      setMsg({ type: 'error', text: 'La nueva contraseña debe tener mínimo 6 caracteres.' });
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setMsg({ type: 'error', text: 'Las contraseñas ingresadas no coinciden.' });
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await axiosClient.post('/auth/recuperar/cambiar-password', {
        userId: userData.userId,
        respuesta,
        nuevaPassword
      });

      setMsg({ type: 'success', text: res.data.message });

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Respuesta incorrecta o error al actualizar.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C1322] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 space-y-5">
        
        {/* Cabecera */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto border border-blue-100">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Recuperación de Contraseña</h2>
          <p className="text-xs text-slate-500">
            {step === 1 
              ? 'Ingresa tu DNI o Correo para consultar tu pregunta secreta' 
              : 'Responde correctamente para establecer una nueva clave'}
          </p>
        </div>

        {/* Notificaciones */}
        {msg.text && (
          <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
            msg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* PASO 1: Identificación */}
        {step === 1 && (
          <form onSubmit={handleFetchQuestion} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                DNI o Correo Institucional *
              </label>
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Ej: 71658420 o admin@mattinnova.com"
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1E56FF] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Consultando en base de datos...' : 'Continuar'}
            </button>
          </form>
        )}

        {/* PASO 2: Responder Pregunta y Nueva Clave */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-700 flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Pregunta de Seguridad</span>
              </span>
              <p className="font-semibold text-slate-900 text-xs">{userData?.pregunta}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tu Respuesta Secreta *</label>
              <input
                type="text"
                required
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribe tu respuesta..."
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nueva Contraseña *</label>
              <input
                type="password"
                required
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirmar Nueva Contraseña *</label>
              <input
                type="password"
                required
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Actualizando contraseña...' : 'Actualizar Contraseña'}
            </button>
          </form>
        )}

        {/* Enlace para volver */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Regresar al Inicio de Sesión</span>
          </Link>
        </div>

      </div>
    </div>
  );
}