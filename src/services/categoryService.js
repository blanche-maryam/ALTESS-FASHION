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

export const categoryService = {
  getAll: async (params = {}) => {
    const res = await api.get('/categories.php' + toQuery(params));
    return res.data;
  },
  getTree: async () => {
    const res = await api.get('/categories.php?tree=1');
    return res.data;
  },
  getRoots: async () => {
    const res = await api.get('/categories.php?roots=1');
    return res.data;
  },
  getSubcategories: async (parentId) => {
    const res = await api.get('/categories.php?subcategories_of=' + parentId);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get('/categories.php?id=' + id);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/categories.php', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put('/categories.php?id=' + id, data);
    return res.data;
  },
  remove: async (id) => {
    const res = await api.delete('/categories.php?id=' + id);
    return res.data;
  },
};
