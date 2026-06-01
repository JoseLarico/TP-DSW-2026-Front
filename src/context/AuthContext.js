'use client';
import { createContext, useContext } from 'react';

// TODO: reemplazar con login real (POST /pacientes o auth mockeado)
// ID del paciente de prueba cargado en la DB
const PACIENTE_PRUEBA = {
  _id: '6a1c491cadb53a186718b624',
  nombre: 'Paciente Test',
  rol: 'paciente',
};

const AuthContext = createContext(PACIENTE_PRUEBA);

export function AuthProvider({ children }) {
  // TODO P4: agregar useState con usuario real y lógica de login/logout
  return (
    <AuthContext.Provider value={PACIENTE_PRUEBA}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
