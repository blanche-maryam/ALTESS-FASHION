import { api } from './api.js';

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      search.append(key, value);
    }
  });
  const qs = search.toString();
  return qs ? '?' + qs : '';
}

export const userService = {
  getProfile: async (id) => {
    const res = await api.get('/users.php?id=' + id);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me.php');
    return res.data;
  },
  updateProfile: async (id, data) => {
    const res = await api.put('/users.php?id=' + id, data);
    return res.data;
  },
  updateMe: async (data) => {
    const res = await api.put('/auth/profile.php', data);
    return res.data;
  },
  getAll: async (params = {}) => {
    const res = await api.get('/users.php' + toQuery(params));
    return res.data;
  },
  adminUpdate: async (id, data) => {
    const res = await api.put('/users.php?id=' + id, data);
    return res.data;
  },
  remove: async (id) => {
    const res = await api.delete('/users.php?id=' + id);
    return res.data;
  },
};
