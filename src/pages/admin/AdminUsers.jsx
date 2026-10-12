import { useCallback, useEffect, useState } from 'react';
import { userService } from '../../services/userService.js';
import { extractError } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { USER_ROLES } from '../../utils/constants.js';
import { formatPrice, formatDate } from '../../utils/helpers.js';
import Modal from '../../components/admin/Modal.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import Pagination from '../../components/admin/Pagination.jsx';

const EMPTY = { firstname: '', lastname: '', email: '', phone: '', address: '', role: 'customer', is_active: 1, password: '' };
const PER_PAGE = 20;

export default function AdminUsers() {
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const [filters, setFilters] = useState({ search: '', role: '', page: 1, per_page: PER_PAGE });
  const [searchInput, setSearchInput] = useState('');
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 0, page: 1, per_page: PER_PAGE });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAll(filters);
      setUsers(data.users || []);
      setMeta({
        total: data.total || 0,
        pages: data.pages || 0,
        page: data.page || 1,
        per_page: data.per_page || PER_PAGE,
      });
    } catch (err) {
      toast.error(extractError(err, 'Impossible de charger les clients'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const set = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? (event.target.checked ? 1 : 0) : event.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      firstname: u.firstname || '',
      lastname: u.lastname || '',
      email: u.email || '',
      phone: u.phone || '',
      address: u.address || '',
      role: u.role || 'customer',
      is_active: Number(u.is_active) ? 1 : 0,
      password: '',
    });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email.trim()) {
      setError("L'email est requis");
      return;
    }
    if (form.password && form.password.length < 6) {
      setError('Mot de passe minimum 6 caractères');
      return;
    }

    const payload = {
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    if (form.password) payload.password = form.password;

    const isSelf = editing.id === currentUser?.id;
    if (!isSelf) {
      payload.role = form.role;
      payload.is_active = form.is_active;
    }

    setSaving(true);
    setError('');
    try {
      const data = await userService.adminUpdate(editing.id, payload);
      toast.success(data.message || 'Client mis à jour');
      setEditing(null);
      load();
    } catch (err) {
      const message = extractError(err, 'Mise à jour impossible');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (u, field) => {
    try {
      const data = await userService.adminUpdate(u.id, { [field]: Number(u[field]) ? 0 : 1 });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, [field]: data.user[field] } : x)));
      toast.success(data.message || 'Mis à jour');
    } catch (err) {
      toast.error(extractError(err, 'Action impossible'));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const data = await userService.remove(toDelete.id);
      toast.success(data.message || 'Client supprimé');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(extractError(err, 'Suppression impossible'));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Clients</h1>
          <p className="muted">{meta.total} compte(s)</p>
        </div>
      </header>

      <section className="admin-filters">
        <div className="filter-group grow">
          <label htmlFor="u-search">Recherche</label>
          <input
            id="u-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nom, prénom, email…"
          />
        </div>
        <div className="filter-group">
          <label htmlFor="u-role">Rôle</label>
          <select
            id="u-role"
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}
          >
            <option value="">Tous</option>
            {USER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <button type="button" className="btn btn-contour" onClick={() => { setSearchInput(''); setFilters({ search: '', role: '', page: 1, per_page: PER_PAGE }); }}>
          Réinitialiser
        </button>
      </section>

      {loading ? (
        <p className="muted padding">Chargement…</p>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>Aucun client</h3>
          <p className="muted">Aucun compte ne correspond à cette recherche.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Rôle</th>
                <th>Commandes</th>
                <th>Total dépensé</th>
                <th>Inscrit le</th>
                <th>Actif</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.firstname} {u.lastname}</strong>
                      {isSelf && <div className="muted small">(vous)</div>}
                    </td>
                    <td>
                      {u.email}
                      {u.phone && <div className="muted small">{u.phone}</div>}
                    </td>
                    <td>
                      <span className={`tag ${u.role === 'admin' ? 'tag-admin' : ''}`}>
                        {USER_ROLES.find((r) => r.value === u.role)?.label || u.role}
                      </span>
                    </td>
                    <td>{u.order_count ?? 0}</td>
                    <td>{formatPrice(u.total_spent || 0)}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className={`switch ${Number(u.is_active) ? 'on' : ''}`}
                        onClick={() => !isSelf && quickToggle(u, 'is_active')}
                        disabled={isSelf}
                        aria-pressed={Number(u.is_active) === 1}
                        aria-label={`${u.firstname} ${u.lastname} : compte ${Number(u.is_active) ? 'actif' : 'inactif'}`}
                        title={isSelf ? 'Vous ne pouvez pas désactiver votre compte' : ''}
                      />
                    </td>
                    <td className="right nowrap">
                      <button type="button" className="btn btn-contour btn-xs" onClick={() => openEdit(u)}>Modifier</button>{' '}
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => setToDelete(u)}
                        disabled={isSelf}
                        title={isSelf ? 'Vous ne pouvez pas supprimer votre compte' : ''}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>

          <Pagination
            page={meta.page}
            pages={meta.pages}
            total={meta.total}
            perPage={meta.per_page}
            itemLabel="client"
            onChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}

      <Modal
        open={Boolean(editing)}
        title={editing ? `Modifier ${editing.firstname} ${editing.lastname}` : ''}
        onClose={() => setEditing(null)}
        footer={(
          <>
            <button type="button" className="btn btn-contour" onClick={() => setEditing(null)} disabled={saving}>Annuler</button>
            <button type="submit" form="user-form" className="btn btn-or" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        )}
      >
        {editing && (
          <form id="user-form" onSubmit={handleSubmit} className="admin-form-grid">
            {error && <p className="error-msg full">{error}</p>}

            <div className="field">
              <label htmlFor="u-first">Prénom</label>
              <input id="u-first" value={form.firstname} onChange={set('firstname')} maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="u-last">Nom</label>
              <input id="u-last" value={form.lastname} onChange={set('lastname')} maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="u-email">Email *</label>
              <input id="u-email" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="field">
              <label htmlFor="u-phone">Téléphone</label>
              <input id="u-phone" value={form.phone} onChange={set('phone')} maxLength={20} />
            </div>
            <div className="field full">
              <label htmlFor="u-address">Adresse</label>
              <textarea id="u-address" rows={2} value={form.address} onChange={set('address')} />
            </div>

            {editing.id === currentUser?.id ? (
              <p className="muted full">Vous ne pouvez pas modifier votre propre rôle ni votre statut.</p>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="u-role-form">Rôle</label>
                  <select id="u-role-form" value={form.role} onChange={set('role')}>
                    {USER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="field field-inline">
                  <label className="switch">
                    <input type="checkbox" checked={form.is_active === 1} onChange={set('is_active')} />
                    <span>Compte actif</span>
                  </label>
                </div>
              </>
            )}

            <div className="field full">
              <label htmlFor="u-pass">Nouveau mot de passe</label>
              <input
                id="u-pass"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Laisser vide pour conserver"
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer le client"
        message={toDelete
          ? `Supprimer définitivement ${toDelete.firstname} ${toDelete.lastname} ? La suppression est refusée si le client a des commandes.`
          : ''}
        confirmLabel="Supprimer"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
