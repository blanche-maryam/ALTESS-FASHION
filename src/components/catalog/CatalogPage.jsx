import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../ProductCard.jsx';
import Loader from '../Loader.jsx';
import Reveal from '../Reveal.jsx';
import { productService } from '../../services/productService.js';
import { categoryService } from '../../services/categoryService.js';
import { extractError } from '../../services/api.js';
import { GENDERS, PRODUCT_SORTS } from '../../utils/constants.js';

const PER_PAGE = 12;

function buildTree(categories, parentId = null) {
  return categories
    .filter((c) => (c.parent_id || null) === parentId)
    .map((c) => ({ ...c, children: buildTree(categories, c.id) }));
}

/**
 * Liste de produits partagée par /boutique, /femme et /homme.
 * Lit exclusively la base : ce que l'admin enregistre est immédiatement visible.
 */
export default function CatalogPage({ lockedGender, title, intro, emptyMessage = 'Aucun produit ne correspond à votre recherche.' }) {
  const [params, setParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const gender = lockedGender || params.get('gender') || '';
  const search = params.get('search') || '';
  const categoryId = params.get('category_id') || '';
  const sort = params.get('sort') || 'newest';
  const minPrice = params.get('min_price') || '';
  const maxPrice = params.get('max_price') || '';
  const inStock = params.get('in_stock') || '';

  useEffect(() => {
    categoryService.getAll().then((d) => setCategories(d.categories || [])).catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productService.getAll({
        gender,
        search,
        category_id: categoryId,
        sort,
        min_price: minPrice,
        max_price: maxPrice,
        in_stock: inStock,
        is_active: 1,
        page,
        per_page: PER_PAGE,
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
    } catch (err) {
      setError(extractError(err, 'Impossible de charger le catalogue'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [gender, search, categoryId, sort, minPrice, maxPrice, inStock, page]);

  useEffect(() => { load(); }, [load]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(1);
  };

  const categoryTree = useMemo(() => buildTree(categories), [categories]);
  const selectedCategory = categories.find((c) => String(c.id) === String(categoryId));

  const hasFilters = Boolean(search || categoryId || sort !== 'newest' || minPrice || maxPrice || inStock || (!lockedGender && gender));

  return (
    <div className="page-shop container">
      <h1>{title}</h1>
      {intro && <p className="muted catalog-intro">{intro}</p>}

      <div className="shop-filters">
        <div className="filter-group grow">
          <label htmlFor="c-search">Recherche</label>
          <input
            id="c-search"
            type="search"
            defaultValue={search}
            placeholder="Nom d'un article…"
            onKeyDown={(e) => { if (e.key === 'Enter') updateParam('search', e.target.value); }}
            onBlur={(e) => updateParam('search', e.target.value)}
          />
        </div>

        {!lockedGender && (
          <div className="filter-group">
            <label htmlFor="c-gender">Public</label>
            <select id="c-gender" value={gender} onChange={(e) => updateParam('gender', e.target.value)}>
              <option value="">Tous</option>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label htmlFor="c-cat">Catégorie</label>
          <select id="c-cat" value={categoryId} onChange={(e) => updateParam('category_id', e.target.value)}>
            <option value="">Toutes</option>
            {categoryTree.map((c) => (
              <optgroup key={c.id} label={c.name}>
                <option value={c.id}>{c.name}</option>
                {c.children.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="c-min">Prix min</label>
          <input id="c-min" type="number" min="0" value={minPrice} onChange={(e) => updateParam('min_price', e.target.value)} />
        </div>

        <div className="filter-group">
          <label htmlFor="c-max">Prix max</label>
          <input id="c-max" type="number" min="0" value={maxPrice} onChange={(e) => updateParam('max_price', e.target.value)} />
        </div>

        <div className="filter-group">
          <label htmlFor="c-sort">Trier</label>
          <select id="c-sort" value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
            {PRODUCT_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="c-stock">Disponibilité</label>
          <select id="c-stock" value={inStock} onChange={(e) => updateParam('in_stock', e.target.value)}>
            <option value="">Tous</option>
            <option value="1">En stock</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            className="btn btn-contour btn-sm"
            onClick={() => { setParams(new URLSearchParams()); setPage(1); }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      <p className="results-count">
        {total} résultat(s)
        {selectedCategory && <> — {selectedCategory.name}</>}
      </p>

      {loading && <Loader />}

      {!loading && error && (
        <div className="empty-state">
          <h3>Catalogue indisponible</h3>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn-or" onClick={load}>Réessayer</button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <h3>Aucun article</h3>
          <p className="muted">{emptyMessage}</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map((p, i) => (
              <Reveal key={p.id} index={i} step={70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
          {pages > 1 && (
            <nav className="catalog-pagination" aria-label="Pagination">
              <button type="button" className="btn btn-contour" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                ‹ Précédent
              </button>
              <span className="muted">Page {page} sur {pages}</span>
              <button type="button" className="btn btn-contour" onClick={() => setPage(page + 1)} disabled={page >= pages}>
                Suivant ›
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
