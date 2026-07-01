'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [paciente, setPaciente] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sm_paciente');
      if (stored) setPaciente(JSON.parse(stored));
      const storedRol = localStorage.getItem('sm_rol');
      if (storedRol) setRol(storedRol);
    } catch { /* ignorar */ }
    setLoading(false);
  }, []);

  const login = ({ token, rol: rolRecibido, paciente: pacienteData, medico: medicoData }) => {
    const entidad = pacienteData || medicoData;
    const entidadConRol = { ...entidad, rol: rolRecibido };
    setPaciente(entidadConRol);
    setRol(rolRecibido);
    localStorage.setItem('sm_paciente', JSON.stringify(entidadConRol));
    localStorage.setItem('sm_token', token);
    localStorage.setItem('sm_rol', rolRecibido);
  };

  const logout = () => {
    setPaciente(null);
    setRol(null);
    localStorage.removeItem('sm_paciente');
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_rol');
  };

  const updateUsuario = (entidad) => {
    const entidadConRol = { ...entidad, rol: entidad.rol || rol };
    setPaciente(entidadConRol);
    localStorage.setItem('sm_paciente', JSON.stringify(entidadConRol));
  };

  return (
    <AuthContext.Provider value={{ paciente, usuario: paciente, rol, login, logout, updateUsuario, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
