import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!loading) setChecked(true);
  }, [loading]);

  if (!checked) return null;
  if (!user) return <Navigate to="/connexion" replace />;
  if (String(user.role || '').toLowerCase() !== 'admin') return <Navigate to="/mon-compte" replace />;

  return children;
}