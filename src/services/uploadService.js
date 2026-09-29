import { api } from './api.js';

export const uploadService = {
  // Upload simple (retourne un chemin relatif) : /api/upload.php
  upload: async (file, folder = 'products') => {
    const body = new FormData();
    body.append('image', file);
    const res = await api.post(`/upload.php?folder=${folder}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Attache une ou plusieurs images à un produit : /api/images.php
  attachToProduct: async (productId, files, { altText, path } = {}) => {
    if (path) {
      const res = await api.post(`/images.php?product_id=${productId}`, { path, alt_text: altText || '' });
      return res.data;
    }
    const body = new FormData();
    Array.from(files).forEach((file) => body.append('images[]', file));
    if (altText) body.append('alt_text', altText);
    const res = await api.post(`/images.php?product_id=${productId}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  listForProduct: async (productId) => {
    const res = await api.get(`/images.php?product_id=${productId}`);
    return res.data;
  },

  removeFromProduct: async (productId, imageId) => {
    const res = await api.delete(`/images.php?product_id=${productId}&image_id=${imageId}`);
    return res.data;
  },

  setPrimary: async (productId, imageId) => {
    const res = await api.post(`/images.php?product_id=${productId}&image_id=${imageId}&primary=1`, {});
    return res.data;
  },

  remove: async (path, folder = 'products') => {
    const res = await api.delete(`/upload.php?folder=${folder}&path=${encodeURIComponent(path)}`);
    return res.data;
  },
};
