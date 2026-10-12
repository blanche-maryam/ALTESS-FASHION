import { useCallback, useEffect, useState } from 'react';
import { categoryService } from '../../services/categoryService.js';
import { uploadService } from '../../services/uploadService.js';
import { extractError } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { AUDIENCES } from '../../utils/constants.js';
import { imageUrl } from '../../utils/images.js';
import Modal from '../../components/admin/Modal.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import Pagination from '../../components/admin/Pagination.jsx';

const EMPTY = {
  name: '',
  slug: '',
  parent_id: '',
  target_audience: 'unisex',
  image: '',
  is_active: 1,
  sort_order: 0,
};

const PER_PAGE = 10;

function renderTree(nodes, depth, editingId, onEdit, onDelete, onToggle) {
  return nodes.map((node) => (
    <li key={node.id}>
      <div className="tree-row" style={{ paddingLeft: depth * 20 }}>
        <span className="tree-label">
          {node.parent_id ? <span className="tree-branch">└</span> : null}
          {node.image
            ? <img src={imageUrl(node.image)} alt="" className="tree-thumb" />
            : <span className="tree-thumb tree-thumb-empty" />}
          <span>{node.name}</span>
        </span>

        <span className="tag-row">
          <span className="tag">{AUDIENCES.find((a) => a.value === node.target_audience)?.label || node.target_audience}</span>
          <span className="tag">{node.product_count || 0} produit(s)</span>
          {Number(node.children_count) > 0 && <span className="tag">{node.children_count} sous-catégorie(s)</span>}
          {!Number(node.is_active) && <span className="tag tag-off">Inactive</span>}
        </span>

        <span className="tree-actions">
          <button type="button" className="btn btn-contour btn-xs" onClick={() => onToggle(node)}>
            {Number(node.is_active) ? 'Désactiver' : 'Activer'}
          </button>
          <button type="button" className="btn btn-contour btn-xs" onClick={() => onEdit(node)}>Modifier</button>
          <button type="button" className="btn btn-danger btn-xs" onClick={() => onDelete(node)}>Supprimer</button>
        </span>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className="tree-children">
          {renderTree(node.children, depth + 1, editingId, onEdit, onDelete, onToggle)}
        </ul>
      )}
    </li>
  ));
}

export default function AdminCategories() {
  const toast = useToast();

  const [tree, setTree] = useState([]);
  const [flat, setFlat] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getTree({ page, per_page: PER_PAGE });
      setTree(data.categories || []);
      setFlat(data.flat || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
      if (data.pages && data.pages < page) setPage(data.pages);
    } catch (err) {
      toast.error(extractError(err, 'Impossible de charger les catégories'));
    } finally {
      setLoading(false);
    }
  }, [toast, page]);

  useEffect(() => { load(); }, [load]);

  const set = (field) => (event) => {
    const value = event.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const openCreate = (parent = null) => {
    setEditing(null);
    setForm({ ...EMPTY, parent_id: parent ? String(parent.id) : '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      parent_id: category.parent_id ? String(category.parent_id) : '',
      target_audience: category.target_audience || 'unisex',
      image: category.image || '',
      is_active: Number(category.is_active) ? 1 : 0,
      sort_order: Number(category.sort_order) || 0,
    });
    setError('');
    setModalOpen(true);
  };

  const parentOptions = flat.filter((c) => !editing || c.id !== editing.id);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const data = await uploadService.upload(file, 'categories');
      setForm((f) => ({ ...f, image: data.image_path }));
      toast.success('Image téléversée');
    } catch (err) {
      toast.error(extractError(err, "Échec de l'envoi de l'image"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Le nom est requis');
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      parent_id: form.parent_id ? Number(form.parent_id) : '',
      target_audience: form.target_audience,
      image: form.image,
      is_active: form.is_active ? 1 : 0,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };

    setSaving(true);
    setError('');
    try {
      const data = editing
        ? await categoryService.update(editing.id, payload)
        : await categoryService.create(payload);
      toast.success(data.message || 'Catégorie enregistrée');
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      const message = extractError(err, "Erreur lors de l'enregistrement");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (category) => {
    try {
      const data = await categoryService.update(category.id, { is_active: Number(category.is_active) ? 0 : 1 });
      toast.success(data.message || 'Statut mis à jour');
      load();
    } catch (err) {
      toast.error(extractError(err, 'Action impossible'));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const data = await categoryService.remove(toDelete.id);
      toast.success(data.message || 'Catégorie supprimée');
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
          <h1>Catégories</h1>
          <p className="muted">{total} catégorie(s) — les modifications sont visibles immédiatement sur la boutique</p>
        </div>
        <button type="button" className="btn btn-or" onClick={() => openCreate()}>+ Nouvelle catégorie</button>
      </header>

      {loading ? (
        <p className="muted padding">Chargement…</p>
      ) : tree.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune catégorie</h3>
          <p className="muted">Créez une catégorie parente pour structurer votre catalogue.</p>
          <button type="button" className="btn btn-or" onClick={() => openCreate()}>+ Nouvelle catégorie</button>
        </div>
      ) : (
        <>
          <ul className="tree">
            {renderTree(tree, 0, editing?.id, openEdit, setToDelete, handleToggle)}
          </ul>

          <Pagination
            page={page}
            pages={pages}
            total={total}
            perPage={PER_PAGE}
            itemLabel="catégorie"
            onChange={setPage}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Modifier « ${editing.name} »` : 'Nouvelle catégorie'}
        onClose={() => setModalOpen(false)}
        footer={(
          <>
            <button type="button" className="btn btn-contour" onClick={() => setModalOpen(false)} disabled={saving}>
              Annuler
            </button>
            <button type="submit" form="category-form" className="btn btn-or" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        )}
      >
        <form id="category-form" onSubmit={handleSubmit} className="admin-form-grid">
          {error && <p className="error-msg full">{error}</p>}

          <div className="field">
            <label htmlFor="c-name">Nom *</label>
            <input id="c-name" value={form.name} onChange={set('name')} required maxLength={100} />
          </div>

          <div className="field">
            <label htmlFor="c-slug">Slug URL</label>
            <input id="c-slug" value={form.slug} onChange={set('slug')} placeholder="généré automatiquement" />
          </div>

          <div className="field">
            <label htmlFor="c-parent">Catégorie parente</label>
            <select id="c-parent" value={form.parent_id} onChange={set('parent_id')}>
              <option value="">— Aucune (catégorie principale) —</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="c-audience">Public cible</label>
            <select id="c-audience" value={form.target_audience} onChange={set('target_audience')}>
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          <div className="field">
            <label htmlFor="c-order">Ordre d'affichage</label>
            <input id="c-order" type="number" step="1" value={form.sort_order} onChange={set('sort_order')} />
          </div>

          <div className="field field-inline">
            <label className="switch">
              <input
                type="checkbox"
                checked={form.is_active === 1}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked ? 1 : 0 }))}
              />
              <span>Catégorie active</span>
            </label>
          </div>

          <div className="field full">
            <label>Image de la catégorie</label>
            <div className="category-image-row">
              {form.image
                ? <img src={imageUrl(form.image)} alt="" className="category-preview" />
                : <span className="tree-thumb tree-thumb-empty large" />}
              <div className="column-gap">
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                {form.image && (
                  <button type="button" className="btn btn-contour btn-xs" onClick={() => setForm((f) => ({ ...f, image: '' }))}>
                    Retirer l'image
                  </button>
                )}
                {uploading && <span className="muted small">Téléversement…</span>}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer la catégorie"
        message={toDelete
          ? `Supprimer « ${toDelete.name} » ? Ses sous-catégories seront supprimées. La suppression est refusée si des produits l'utilisent.`
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
