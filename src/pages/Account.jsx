import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService.js';
import { authService } from '../services/authService.js';
import { extractError } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import Reveal from '../components/Reveal.jsx';
import { formatDate } from '../utils/helpers.js';

export default function Account() {
  const { user, login, logout, loading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await userService.getMe();
      setProfile(data.user);
    } catch (err) {
      toast.error(extractError(err, 'Impossible de charger votre profil'));
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { load(); }, [load]);

  const updateField = (field) => (event) => {
    setProfile((p) => ({ ...p, [field]: event.target.value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await userService.updateMe({
        firstname: profile.firstname,
        lastname: profile.lastname,
        phone: profile.phone || '',
        address: profile.address || '',
      });
      if (data?.user) {
        setProfile(data.user);
        login({ ...user, ...data.user });
      }
      toast.success('Profil mis à jour');
    } catch (err) {
      toast.error(extractError(err, 'Mise à jour impossible'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (passwords.new_password.length < 6) {
      toast.error('Le nouveau mot de passe doit faire au moins 6 caractères');
      return;
    }
    if (passwords.new_password !== passwords.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setSaving(true);
    try {
      await userService.updateMe({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: '', new_password: '', confirm: '' });
      toast.success('Mot de passe modifié');
    } catch (err) {
      toast.error(extractError(err, 'Modification impossible'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* session locale nettoyée */ }
    logout();
    navigate('/', { replace: true });
  };

  if (authLoading || (user && loading)) return <Loader />;

  if (!user) {
    return (
      <div className="container page-account">
        <div className="empty-state">
          <h1 className="page-title">Connexion requise</h1>
          <p className="muted">Connectez-vous pour accéder à votre compte.</p>
          <Link to="/connexion" className="btn btn-or">Se connecter</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-account page-enter">
      <Reveal as="h1" className="page-title">Mon compte</Reveal>

      <Reveal index={1} step={80}>
        <div className="account-tabs">
          <button type="button" className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
            Profil
          </button>
          <button type="button" className={activeTab === 'password' ? 'active' : ''} onClick={() => setActiveTab('password')}>
            Sécurité
          </button>
        </div>
      </Reveal>

      {activeTab === 'profile' && profile && (
        <Reveal index={2} step={80} className="account-section">
          <h2>Informations personnelles</h2>
          <div className="field-row">
            <div className="field">
              <label htmlFor="a-first">Prénom</label>
              <input id="a-first" value={profile.firstname || ''} onChange={updateField('firstname')} maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="a-last">Nom</label>
              <input id="a-last" value={profile.lastname || ''} onChange={updateField('lastname')} maxLength={100} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="a-email">Email</label>
            <input id="a-email" type="email" value={profile.email || ''} readOnly aria-readonly="true" />
            <p className="muted small">L'email sert d'identifiant de connexion et ne peut pas être modifié ici.</p>
          </div>
          <div className="field">
            <label htmlFor="a-phone">Téléphone</label>
            <input id="a-phone" value={profile.phone || ''} onChange={updateField('phone')} maxLength={20} />
          </div>
          <div className="field">
            <label htmlFor="a-address">Adresse de livraison</label>
            <textarea id="a-address" rows={3} value={profile.address || ''} onChange={updateField('address')} />
          </div>
          <p className="muted small">Membre depuis le {formatDate(profile.created_at)}</p>
          <button type="submit" className="btn btn-or" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </Reveal>
      )}

      {activeTab === 'password' && (
        <Reveal index={3} step={80} className="account-section">
          <h2>Changer le mot de passe</h2>
          <div className="field">
            <label htmlFor="a-curpass">Mot de passe actuel</label>
            <input
              id="a-curpass"
              type="password"
              value={passwords.current_password}
              onChange={(e) => setPasswords((p) => ({ ...p, current_password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="field">
            <label htmlFor="a-newpass">Nouveau mot de passe</label>
            <input
              id="a-newpass"
              type="password"
              value={passwords.new_password}
              onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="a-confirm">Confirmer</label>
            <input
              id="a-confirm"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-or" disabled={saving}>
            {saving ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </Reveal>
      )}

      <Reveal index={4} step={80} className="account-footer">
        {user.role === 'admin' && (
          <Link to="/admin" className="btn btn-contour">Espace administrateur</Link>
        )}
        <Link to="/mes-commandes" className="btn btn-contour">Mes commandes</Link>
        <button type="button" className="btn btn-danger" onClick={handleLogout}>Déconnexion</button>
      </Reveal>
    </div>
  );
}
