"use client";
import React from 'react';

export default function Pagination({ page, totalPages, onChange }) {
  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <button className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
      <span className="text-sm text-gray-600">Página {page} / {totalPages || 1}</span>
      <button className="btn" disabled={page >= (totalPages || 1)} onClick={() => onChange(page + 1)}>Siguiente</button>
    </div>
  );
}
