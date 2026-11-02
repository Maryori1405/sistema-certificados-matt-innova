// frontend/src/pages/Directory.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Edit3, 
  Save, 
  ShieldCheck, 
  Key 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

// Las 4 opciones predefinidas de preguntas de seguridad
const SECURITY_QUESTIONS = [
  '¿Cuál es el nombre de tu primera mascota?',
  '¿Cuál es el nombre de tu colegio de secundaria?',
  '¿En qué ciudad nacieron tus padres?',
  '¿Cuál es tu comida o plato favorito?'
];

export default function Directory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Estados del Modal de Registro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo_institucional: '',
    password: '',
    tipo_usuario: 'Practicante',
    area_asignada: 'Ingeniería de Sistemas',
    pregunta_seguridad: SECURITY_QUESTIONS[0],
    respuesta_seguridad: '',
  });
  const [modalMsg, setModalMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  // Estados del Modal de Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo_institucional: '',
    password: '',
    tipo_usuario: 'Practicante',
    area_asignada: 'Ingeniería de Sistemas',
    estado: 'Activo',
    pregunta_seguridad: SECURITY_QUESTIONS[0],
    respuesta_seguridad: ''
  });
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/users?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=8`);
      
      let list = [];
      let total = 0;

      if (Array.isArray(res.data)) {
        list = res.data;
        total = res.data.length;
      } else if (res.data && Array.isArray(res.data.users)) {
        list = res.data.users;
        total = res.data.total ?? res.data.users.length;
      }

      setCollaborators(list);
      setTotalRecords(total);
      
      const calculatedPages = Math.ceil(total / 8) || 1;
      setTotalPages(res.data?.totalPages || calculatedPages);
    } catch (err) {
      console.error('Error cargando colaboradores desde PostgreSQL:', err);
      setCollaborators([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, currentPage]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const cleanDni = modalForm.dni ? modalForm.dni.trim() : '';

    if (!cleanDni || cleanDni.length !== 8) {
      setModalMsg({ type: 'error', text: 'El DNI debe contener exactamente 8 dígitos numéricos.' });
      return;
    }

    if (!modalForm.respuesta_seguridad.trim()) {
      setModalMsg({ type: 'error', text: 'Debe ingresar una respuesta secreta para recuperar la contraseña.' });
      return;
    }

    setSaving(true);
    setModalMsg({ type: '', text: '' });

    try {
      await axiosClient.post('/users', {
        ...modalForm,
        dni: cleanDni
      });
      setModalMsg({ type: 'success', text: '¡Usuario registrado correctamente con sus credenciales!' });
      
      setTimeout(() => {
        setIsModalOpen(false);
        setModalMsg({ type: '', text: '' });
        setModalForm({
          dni: '',
          nombres: '',
          apellidos: '',
          correo_institucional: '',
          password: '',
          tipo_usuario: 'Practicante',
          area_asignada: 'Ingeniería de Sistemas',
          pregunta_seguridad: SECURITY_QUESTIONS[0],
          respuesta_seguridad: '',
        });
        fetchUsers();
      }, 1200);
    } catch (err) {
      setModalMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Error al guardar el usuario en la base de datos.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (user) => {
    const targetId = user.id ?? user._id;
    setEditingUserId(targetId);

    // Si el usuario ya tiene guardada una de las 4 opciones, se preserva; si no, se toma la primera
    const assignedQuestion = SECURITY_QUESTIONS.includes(user.pregunta_seguridad)
      ? user.pregunta_seguridad
      : SECURITY_QUESTIONS[0];

    setEditForm({
      dni: user.dni || '',
      nombres: user.nombres || '',
      apellidos: user.apellidos || '',
      correo_institucional: user.correo_institucional || '',
      password: '',
      tipo_usuario: user.tipo_usuario || 'Practicante',
      area_asignada: user.area_asignada || 'Ingeniería de Sistemas',
      estado: user.estado || 'Activo',
      pregunta_seguridad: assignedQuestion,
      respuesta_seguridad: ''
    });
    setEditMsg({ type: '', text: '' });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!editingUserId) {
      setEditMsg({ type: 'error', text: 'No se pudo identificar el colaborador.' });
      return;
    }

    const cleanDni = editForm.dni ? String(editForm.dni).trim() : '';

    if (!cleanDni || cleanDni.length !== 8) {
      setEditMsg({ type: 'error', text: 'El DNI debe contener exactamente 8 dígitos numéricos.' });
      return;
    }

    if (!editForm.nombres.trim() || !editForm.apellidos.trim() || !editForm.correo_institucional.trim()) {
      setEditMsg({ type: 'error', text: 'Nombres, apellidos y correo son obligatorios.' });
      return;
    }

    setSavingEdit(true);
    setEditMsg({ type: '', text: '' });

    try {
      await axiosClient.put(`/users/${editingUserId}`, {
        ...editForm,
        dni: cleanDni
      });

      setEditMsg({ type: 'success', text: '¡Datos y credenciales actualizados exitosamente!' });

      setCollaborators(prev =>
        prev.map(item => ((item.id ?? item._id) === editingUserId ? { ...item, ...editForm, dni: cleanDni } : item))
      );

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditMsg({ type: '', text: '' });
      }, 1000);
    } catch (err) {
      setEditMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error al actualizar los datos en el servidor.'
      });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Directorio de Usuarios y Colaboradores</h2>
          <p className="text-xs text-slate-500">Gestión de accesos, roles y emisión de certificados digitales</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por DNI, Nombre o Correo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 w-64 bg-slate-50/50"
            />
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1E56FF] hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Usuario / Administrador</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4">DNI</th>
              <th className="py-3 px-4">NOMBRES Y APELLIDOS</th>
              <th className="py-3 px-4">CORREO DE ACCESO</th>
              <th className="py-3 px-4">ROL / TIPO</th>
              <th className="py-3 px-4">ÁREA ASIGNADA</th>
              <th className="py-3 px-4">ESTADO</th>
              <th className="py-3 px-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando registros de PostgreSQL...</span>
                  </div>
                </td>
              </tr>
            ) : !collaborators || collaborators.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                  No se encontraron usuarios registrados.
                </td>
              </tr>
            ) : (
              collaborators.map((item) => (
                <tr key={item.id ?? item._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">{item.dni}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{item.nombres} {item.apellidos}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{item.correo_institucional}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      item.tipo_usuario === 'Administrador'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
                        : item.tipo_usuario === 'Practicante' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {item.tipo_usuario}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{item.area_asignada}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${
                      item.estado === 'Activo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.estado === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <span>{item.estado}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-3">
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="text-amber-600 hover:text-amber-800 font-semibold text-xs inline-flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    {item.tipo_usuario !== 'Administrador' && (
                      <button 
                        onClick={() => navigate('/admin/emitir', { state: { selectedUserId: item.id ?? item._id } })}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs transition cursor-pointer"
                      >
                        Emitir Cert.
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
        <span>Total: <strong>{totalRecords}</strong> usuarios registrados en Neon Cloud</span>
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            disabled={currentPage <= 1 || loading}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="border border-slate-200 px-3 py-1 rounded bg-slate-50 hover:bg-slate-100 disabled:opacity-40 transition font-medium"
          >
            Anterior
          </button>
          <span className="border border-slate-200 px-3 py-1 rounded bg-slate-50 font-medium">
            Pág. {currentPage} de {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages || loading}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="border border-slate-200 px-3 py-1 rounded bg-slate-50 hover:bg-slate-100 disabled:opacity-40 transition font-medium"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal: Registrar Nuevo Usuario / Administrador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Crear Nuevo Perfil de Usuario</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMsg.text && (
              <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                modalMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {modalMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DNI (8 dígitos) *</label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={modalForm.dni}
                    onChange={(e) => setModalForm({ ...modalForm, dni: e.target.value.replace(/\D/g, '') })}
                    placeholder="Ej: 71658420"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono tracking-wider"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rol / Tipo *</label>
                  <select
                    value={modalForm.tipo_usuario}
                    onChange={(e) => setModalForm({ ...modalForm, tipo_usuario: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="Administrador">Administrador (Acceso Completo)</option>
                    <option value="Practicante">Practicante</option>
                    <option value="Trabajador">Trabajador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.nombres}
                    onChange={(e) => setModalForm({ ...modalForm, nombres: e.target.value })}
                    placeholder="Nombres"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.apellidos}
                    onChange={(e) => setModalForm({ ...modalForm, apellidos: e.target.value })}
                    placeholder="Apellidos"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Institucional para Acceso *</label>
                <input
                  type="email"
                  required
                  value={modalForm.correo_institucional}
                  onChange={(e) => setModalForm({ ...modalForm, correo_institucional: e.target.value })}
                  placeholder="admin@mattinnova.com"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contraseña Inicial *</label>
                  <input
                    type="password"
                    required
                    value={modalForm.password}
                    onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Área Asignada *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.area_asignada}
                    onChange={(e) => setModalForm({ ...modalForm, area_asignada: e.target.value })}
                    placeholder="Ej: Gerencia / TI"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Selector de Pregunta de Seguridad y Respuesta */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Recuperación de Contraseña</p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selecciona una Pregunta de Seguridad *</label>
                  <select
                    value={modalForm.pregunta_seguridad}
                    onChange={(e) => setModalForm({ ...modalForm, pregunta_seguridad: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 font-medium"
                  >
                    {SECURITY_QUESTIONS.map((q, idx) => (
                      <option key={idx} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tu Respuesta Secreta *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.respuesta_seguridad}
                    onChange={(e) => setModalForm({ ...modalForm, respuesta_seguridad: e.target.value })}
                    placeholder="Escribe la respuesta secreta correspondiente"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-amber-50/20"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#1E56FF] hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Crear Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuario / Modificar Pregunta de Seguridad */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Modificar Perfil y Credenciales</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editMsg.text && (
              <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                editMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {editMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{editMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DNI (8 dígitos) *</label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={editForm.dni}
                    onChange={(e) => setEditForm({ ...editForm, dni: e.target.value.replace(/\D/g, '') })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono tracking-wider bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rol / Tipo</label>
                  <select
                    value={editForm.tipo_usuario}
                    onChange={(e) => setEditForm({ ...editForm, tipo_usuario: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Practicante">Practicante</option>
                    <option value="Trabajador">Trabajador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={editForm.nombres}
                    onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={editForm.apellidos}
                    onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo de Acceso *</label>
                <input
                  type="email"
                  required
                  value={editForm.correo_institucional}
                  onChange={(e) => setEditForm({ ...editForm, correo_institucional: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={editForm.estado}
                    onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Área Asignada *</label>
                  <input
                    type="text"
                    required
                    value={editForm.area_asignada}
                    onChange={(e) => setEditForm({ ...editForm, area_asignada: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Cambio de Contraseña */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>Actualizar Contraseña de Acceso (Opcional)</span>
                </div>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Dejar vacío para conservar la contraseña actual"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              {/* Selector de las 4 Preguntas y Respuesta */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Pregunta y Respuesta de Seguridad</p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pregunta de Seguridad</label>
                  <select
                    value={editForm.pregunta_seguridad}
                    onChange={(e) => setEditForm({ ...editForm, pregunta_seguridad: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 font-medium"
                  >
                    {SECURITY_QUESTIONS.map((q, idx) => (
                      <option key={idx} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nueva Respuesta Secreta (Opcional)</label>
                  <input
                    type="text"
                    value={editForm.respuesta_seguridad}
                    onChange={(e) => setEditForm({ ...editForm, respuesta_seguridad: e.target.value })}
                    placeholder="Dejar vacío para conservar la respuesta anterior"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-amber-50/20"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-[#1E56FF] hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Actualizando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}