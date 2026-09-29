import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 8000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Session PHP expirée alors que le navigateur croit encore être connecté :
    // on purge la session locale pour renvoyer vers la connexion plutôt que de
    // laisser l'interface afficher des listes vides sans explication.
    if (error.response?.status === 401 && localStorage.getItem('user')) {
      localStorage.removeItem('user');
      localStorage.removeItem('admin_user');
      if (!window.location.pathname.startsWith('/connexion')) {
        window.location.assign('/connexion?expiree=1');
      }
    }
    if (error.response) return Promise.reject(error);
    return Promise.reject(new Error('Service indisponible'));
  }
);

export function extractError(error, fallback = 'Une erreur est survenue') {
  return error?.response?.data?.error || error?.message || fallback;
}

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});
