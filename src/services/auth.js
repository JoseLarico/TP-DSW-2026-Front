import api from './api';

export const loginApi = (nombreUsuario, password) =>
    api.post('/auth/login', { nombreUsuario, password }).then(r => r.data);
