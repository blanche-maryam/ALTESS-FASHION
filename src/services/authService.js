import { api } from './api.js';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login.php', { email, password });
    return res.data;
  },
  register: async (data) => {
    const res = await api.post('/auth/register.php', data);
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout.php');
    return res.data;
  },
  me: async () => {
    const res = await api.get('/auth/me.php');
    return res.data;
  },
};
