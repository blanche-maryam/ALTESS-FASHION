import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService.js';
import { categoryService } from '../../services/categoryService.js';
import { extractError } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { GENDERS, PRODUCT_SORTS } from '../../utils/constants.js';
import { formatPrice, formatDate } from '../../utils/helpers.js';
import { productThumb } from '../../utils/images.js';
import Pagination from '../../components/admin/Pagination.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ProductFormModal from './ProductFormModal.jsx';

const DEFAULT_FILTERS = {
  search: '',
  gender: '',
  category_id: '',
  is_active: '',
  is_promo: '',
  in_stock: '',
  sort: 'newest',
  page: 1,
  per_page: 20,
};

export default function AdminProducts() {
  const toast = useToast();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 0, page: 1, per_page: 20 });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (override) => {
    const active = { ...filters, ...override };
    setLoading(true);
    try {
      const data = await productService.getAll(active);
      setProducts(data.products || []);
      setMeta({ total: data.total || 0, pages: data.pages || 0, page: data.page || 1, per_page: data.per_page || active.per_page });
      if (override?.page) setFilters((f) => ({ ...f, page: override.page }));
    } catch (err) {
      toast.error(extractError(err, 'Impossible de charger les produits'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    categoryService.getAll().then((d) => setCategories(d.categories || [])).catch(() => setCategories([]));
  }, []);

  // Recherche différée
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setFilter = (field) => (event) => {
    const value = event.target.value;
    setFilters((f) => ({ ...f, [field]: value, page: 1 }));
  };

  const handleToggleActive = async (product) => {
    try {
      const data = await productService.setActive(product.id, !Number(product.is_active));
      setProducts((list) => list.map((p) => (p.id === product.id ? { ...p, is_active: data.product.is_active } : p)));
      toast.success(data.product.is_active ? 'Produit mis en ligne' : 'Produit mis hors ligne');
    } catch (err) {
      toast.error(extractError(err, 'Action impossible'));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await productService.remove(toDelete.id);
      toast.success(`« ${toDelete.name} » a été supprimé`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(extractError(err, 'Suppression impossible'));
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = async (product) => {
    try {
      const data = await productService.getById(product.id);
      setEditing(data.product);
      setFormOpen(true);
    } catch (err) {
      toast.error(extractError(err, 'Impossible de charger le produit'));
    }
  };

  const activeFilterCount = useMemo(
    () => ['search', 'gender', 'category_id', 'is_active', 'is_promo', 'in_stock']
      .filter((k) => filters[k] !== '' && filters[k] !== undefined).length,
    [filters]
  );

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Produits</h1>
          <p className="muted">{meta.total} produit(s) au catalogue</p>
        </div>
        <button type="button" className="btn btn-or" onClick={openCreate}>+ Nouveau produit</button>
      </header>

      <section className="admin-filters">
        <div className="filter-group grow">
          <label htmlFor="f-search">Recherche</label>
          <input
            id="f-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nom, description, slug…"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="f-cat">Catégorie</label>
          <select id="f-cat" value={filters.category_id} onChange={setFilter('category_id')}>
            <option value="">Toutes</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="f-gender">Public</label>
          <select id="f-gender" value={filters.gender} onChange={setFilter('gender')}>
            <option value="">Tous</option>
            {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="f-active">Visibilité</label>
          <select id="f-active" value={filters.is_active} onChange={setFilter('is_active')}>
            <option value="">Tous</option>
            <option value="1">En ligne</option>
            <option value="0">Hors ligne</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="f-promo">Promotion</label>
          <select id="f-promo" value={filters.is_promo} onChange={setFilter('is_promo')}>
            <option value="">Tous</option>
            <option value="1">En promo</option>
            <option value="0">Sans promo</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="f-stock">Stock</label>
          <select id="f-stock" value={filters.in_stock} onChange={setFilter('in_stock')}>
            <option value="">Tous</option>
            <option value="1">Disponible</option>
            <option value="0">Rupture</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="f-sort">Trier par</label>
          <select id="f-sort" value={filters.sort} onChange={setFilter('sort')}>
            {PRODUCT_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            className="btn btn-contour"
            onClick={() => { setSearchInput(''); setFilters(DEFAULT_FILTERS); }}
          >
            Réinitialiser ({activeFilterCount})
          </button>
        )}
      </section>

      {loading ? (
        <p className="muted padding">Chargement…</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>Aucun produit</h3>
          <p className="muted">Ajustez les filtres ou créez un premier produit.</p>
          <button type="button" className="btn btn-or" onClick={openCreate}>+ Nouveau produit</button>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Visibilité</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const promo = p.old_price && Number(p.old_price) > Number(p.price);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-product">
                          <img src={productThumb(p)} alt="" className="cell-thumb" />
                          <div>
                            <strong>{p.name}</strong>
                            <span className="muted small">/{p.slug}</span>
                            <div className="tag-row">
                              {p.gender && <span className="tag">{GENDERS.find((g) => g.value === p.gender)?.label || p.gender}</span>}
                              {promo && <span className="tag tag-promo">Promo</span>}
                              {Number(p.image_count) > 0 && <span className="tag">{p.image_count} img</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {p.category_name || '—'}
                        {p.subcategory_name && <div className="muted small">{p.subcategory_name}</div>}
                      </td>
                      <td>
                        <strong>{formatPrice(p.price)}</strong>
                        {promo && <div className="old-price">{formatPrice(p.old_price)}</div>}
                      </td>
                      <td>
                        <span className={`stock-pill ${Number(p.stock) === 0 ? 'out' : Number(p.stock) <= 5 ? 'low' : 'ok'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`switch ${Number(p.is_active) ? 'on' : ''}`}
                          onClick={() => handleToggleActive(p)}
                          aria-pressed={Number(p.is_active) === 1}
                          aria-label={`${p.name} : ${Number(p.is_active) ? 'visible en boutique' : 'masqué'}`}
                          title={Number(p.is_active) ? 'Mettre hors ligne' : 'Mettre en ligne'}
                        />
                        <div className="muted small">{formatDate(p.updated_at || p.created_at)}</div>
                      </td>
                      <td className="right nowrap">
                        <Link to={`/produit/${p.slug}`} className="btn btn-contour btn-xs" target="_blank" rel="noreferrer">Voir</Link>{' '}
                        <button type="button" className="btn btn-contour btn-xs" onClick={() => openEdit(p)}>Modifier</button>{' '}
                        <button type="button" className="btn btn-danger btn-xs" onClick={() => setToDelete(p)}>Supprimer</button>
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
            itemLabel="produit"
            onChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}

      <ProductFormModal
        open={formOpen}
        product={editing}
        categories={categories}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={() => load()}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer le produit"
        message={toDelete ? `Supprimer définitivement « ${toDelete.name} » ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
