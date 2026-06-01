'use client';
import { createContext, useContext } from 'react';

// TODO: reemplazar con login real (POST /pacientes o auth mockeado)
// ID del paciente de prueba cargado en la DB
const PACIENTE_PRUEBA = {
  _id: '6a1c491cadb53a186718b624',
  nombre: 'Paciente Test',
  rol: 'paciente',
};

// ID del medico de prueba cargado en la DB
const MEDICO_PRUEBA = {
  _id: '6a1da3580687ba0250e4439f', 
  nombre: 'Medico Test',
  rol: 'medico',
};

const AuthContext = createContext(PACIENTE_PRUEBA);

export function AuthProvider({ children }) {
  // TODO P4: agregar useState con usuario real y lógica de login/logout
  // TESTING P5: cambiar PACIENTE_PRUEBA por MEDICO_PRUEBA para testear panel médico

  return (
    <AuthContext.Provider value={PACIENTE_PRUEBA}> //cambiarlo aca
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
