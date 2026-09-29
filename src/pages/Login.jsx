import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { extractError } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('expiree') ? 'Votre session a expiré, veuillez vous reconnecter.' : '');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email.trim(), password);
      if (!data?.success || !data?.user) {
        setError(data?.error || 'Identifiants incorrects');
        return;
      }

      const account = data.user;
      login(account);

      if (String(account.role || '').toLowerCase() === 'admin') {
        toast.success(`Bienvenue ${account.firstname}`);
        navigate('/admin', { replace: true });
      } else {
        toast.success(`Bienvenue ${account.firstname}`);
        navigate('/mon-compte', { replace: true });
      }
    } catch (err) {
      const message = extractError(err, 'Erreur de connexion');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-auth">
      <div className="auth-card">
        <h1>Connexion</h1>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="champ">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="champ">
            <label htmlFor="login-pass">Mot de passe</label>
            <input
              id="login-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-or btn-block" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/">Retour à la boutique</Link>
          <Link to="/inscription">Pas encore de compte ? S'inscrire</Link>
        </div>
      </div>
    </div>
  );
}
