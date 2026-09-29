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

export const orderService = {
  create: async (data) => {
    const res = await api.post('/orders.php', data);
    return res.data;
  },
  getMine: async (params = {}) => {
    const res = await api.get('/orders.php' + toQuery(params));
    return res.data;
  },
  getAll: async (params = {}) => {
    const res = await api.get('/orders.php' + toQuery({ all: 1, ...params }));
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get('/orders.php?id=' + id);
    return res.data;
  },
  getByNumber: async (number) => {
    const res = await api.get('/orders.php?number=' + encodeURIComponent(number));
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put('/orders.php?id=' + id, data);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch('/orders.php?id=' + id, { status });
    return res.data;
  },
};
