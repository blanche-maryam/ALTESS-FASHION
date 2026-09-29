import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { extractError } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [form, setForm] = useState({ lastname: '', firstname: '', email: '', phone: '', password: '', password_confirm: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.register(form);
      if (!data?.success) {
        setError(data?.error || "Erreur d'inscription");
        return;
      }
      login({ id: data.user_id, firstname: form.firstname, lastname: form.lastname, email: form.email, role: 'customer' });
      navigate('/mon-compte', { replace: true });
    } catch (err) { setError(extractError(err, "Erreur d'inscription")); }
    finally { setLoading(false); }
  };

  return (
    <div className="container page-auth">
      <div className="auth-card">
        <h1>Inscription</h1>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="champ"><label>Nom</label><input name="lastname" value={form.lastname} onChange={handleChange} required /></div>
          <div className="champ"><label>Prénom</label><input name="firstname" value={form.firstname} onChange={handleChange} required /></div>
          <div className="champ"><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} required /></div>
          <div className="champ"><label>Téléphone</label><input name="phone" value={form.phone} onChange={handleChange} /></div>
          <div className="champ"><label>Mot de passe</label><input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} /></div>
          <div className="champ"><label>Confirmer le mot de passe</label><input type="password" name="password_confirm" value={form.password_confirm} onChange={handleChange} required /></div>
          <div className="champ"><label>Adresse</label><textarea name="address" value={form.address} onChange={handleChange} /></div>
          <button type="submit" className="btn btn-primaire" disabled={loading}>{loading ? 'Inscription...' : "Créer mon compte"}</button>
        </form>
        <div className="auth-links"><Link to="/connexion">Déjà un compte ? Se connecter</Link></div>
      </div>
    </div>
  );
}