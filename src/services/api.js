import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const hadToken = !!localStorage.getItem('sm_token');
      if (hadToken) {
        localStorage.removeItem('sm_token');
        localStorage.removeItem('sm_paciente');
        localStorage.removeItem('sm_rol');
        window.location.href = '/login';
        return Promise.reject(new Error('Sesión expirada. Ingresá nuevamente.'));
      }
    }
    const message = !error.response
      ? 'No se puede conectar con el servidor. Verificá que el backend esté corriendo.'
      : error.response.data?.message ||
        error.response.data?.error ||
        'Error inesperado. Intentá de nuevo.';
    return Promise.reject(new Error(message));
  }
);

export default api;
