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

export const productService = {
  getAll: async (filters = {}) => {
    const res = await api.get('/products.php' + toQuery(filters));
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get('/products.php?id=' + id);
    return res.data;
  },
  getBySlug: async (slug) => {
    const res = await api.get('/products.php?slug=' + encodeURIComponent(slug));
    return res.data;
  },
  search: async (query, filters = {}) => {
    const res = await api.get('/products.php' + toQuery({ ...filters, search: query }));
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/products.php', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put('/products.php?id=' + id, data);
    return res.data;
  },
  setActive: async (id, isActive) => {
    const res = await api.patch('/products.php?id=' + id, { is_active: isActive ? 1 : 0 });
    return res.data;
  },
  remove: async (id) => {
    const res = await api.delete('/products.php?id=' + id);
    return res.data;
  },
};
