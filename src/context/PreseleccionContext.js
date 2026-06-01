"use client";
import React, { createContext, useContext, useState } from 'react';

const PreseleccionContext = createContext(null);

export function PreseleccionProvider({ children }) {
  const [turnos, setTurnos] = useState([]);

  const addTurno = (turno) => {
    setTurnos((prev) => {
      if (prev.find(t => t.id === turno.id)) return prev;
      return [...prev, turno];
    });
  };

  const removeTurno = (turnoId) => {
    setTurnos((prev) => prev.filter(t => t.id !== turnoId));
  };

  return (
    <PreseleccionContext.Provider value={{ turnos, addTurno, removeTurno }}>
      {children}
    </PreseleccionContext.Provider>
  );
}

export function usePreseleccion() {
  const ctx = useContext(PreseleccionContext);
  if (!ctx) throw new Error('usePreseleccion must be used within PreseleccionProvider');
  return ctx;
}

export default PreseleccionContext;
