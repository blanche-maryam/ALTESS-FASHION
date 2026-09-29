import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const stored = localStorage.getItem('user');

    if (!stored) {
      setLoading(false);
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(stored);
    } catch {
      parsed = null;
    }
    if (!parsed?.id) {
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }

    // La session PHP fait foi : elle peut avoir expiré alors que le
    // navigateur garde l'utilisateur en local. Sans cette vérification,
    // l'interface afficherait des pages vides au lieu d'une erreur claire.
    authService
      .me()
      .then((data) => {
        if (cancelled) return;
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          localStorage.removeItem('user');
        }
      })
      .catch(() => {
        if (!cancelled) localStorage.removeItem('user');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('admin_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
