// frontend/src/components/common/BadgeStatus.jsx
import React from 'react';

export default function BadgeStatus({ status }) {
  const isVigente = status === 'Vigente' || status === 'Activo';
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${
        isVigente
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isVigente ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
      <span>{status}</span>
    </span>
  );
}