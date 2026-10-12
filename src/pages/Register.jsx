import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { extractError } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Reveal from '../components/Reveal.jsx';

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
      <Reveal variant="scale" className="auth-card">
        <h1>Inscription</h1>
        {error && <p className="error-msg anim-shake">{error}</p>}
        <form onSubmit={handleSubmit}>
          {[
            ['lastname','Nom'],['firstname','Prénom'],['email','Email','email'],
            ['phone','Téléphone'],['password','Mot de passe','password'],
            ['password_confirm','Confirmer le mot de passe','password'],['address','Adresse']
          ].map(([name,label,type],i) => (
            <Reveal key={name} index={i} step={70} className="champ">
              <label>{label}</label>
              {name === 'address' ? (
                <textarea name={name} value={form[name]} onChange={handleChange} />
              ) : (
                <input type={type || 'text'} name={name} value={form[name]} onChange={handleChange} required={name !== 'phone'} />
              )}
            </Reveal>
          ))}
          <Reveal index={7} step={70}>
            <button type="submit" className="btn btn-primaire" disabled={loading}>{loading ? 'Inscription...' : "Créer mon compte"}</button>
          </Reveal>
        </form>
        <Reveal index={8} step={70} className="auth-links"><Link to="/connexion">Déjà un compte ? Se connecter</Link></Reveal>
      </Reveal>
    </div>
  );
}