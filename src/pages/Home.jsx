import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/habit2.jpeg';
import ProductCard from '../components/ProductCard.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import Loader from '../components/Loader.jsx';
import Reveal from '../components/Reveal.jsx';
import { productService } from '../services/productService.js';
import { categoryService } from '../services/categoryService.js';

export default function Home() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [promos, setPromos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [newRes, promoRes, catRes] = await Promise.allSettled([
      productService.getAll({ per_page: 4, sort: 'newest', is_active: 1 }),
      productService.getAll({ per_page: 4, is_promo: 1, is_active: 1 }),
      categoryService.getAll({ roots: 1 }),
    ]);

    if (newRes.status === 'fulfilled') setNewArrivals(newRes.value.products || []);
    if (promoRes.status === 'fulfilled') setPromos(promoRes.value.products || []);
    if (catRes.status === 'fulfilled') {
      // Les racines sont scopées par genre, donc un même nom peut revenir
      // plusieurs fois. On regroupe et on garde la branche la plus fournie.
      const grouped = new Map();
      (catRes.value.categories || []).forEach((c) => {
        const existing = grouped.get(c.name);
        if (!existing || Number(c.product_count) > Number(existing.product_count)) {
          grouped.set(c.name, c);
        }
      });
      setCategories([...grouped.values()]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="home-page">
      <section
        className="hero hero-image"
        style={{ '--hero-image': `url(${heroImage})` }}
      >
        <div className="container hero-content">
          <h1>Bienvenue chez ALTESS FASHION</h1>
          <p>Découvrez nos collections exclusives pour femmes et hommes. Qualité premium, élégance intemporelle.</p>
          <Link to="/boutique" className="btn btn-or">Découvrir la collection</Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal as="h2">Nos catégories</Reveal>
          {loading ? <Loader /> : categories.length === 0 ? (
            <p className="muted">Aucune catégorie publiée pour le moment.</p>
          ) : (
            <div className="category-grid">
              {categories.map((c, i) => (
                <Reveal key={c.id} variant="scale" index={i} step={80}>
                  <CategoryCard category={c} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <Reveal as="h2">Nouveautés</Reveal>
          {loading ? <Loader /> : newArrivals.length === 0 ? (
            <p className="muted">Découvrez nos nouveautés.</p>
          ) : (
            <div className="product-grid">
              {newArrivals.map((p, i) => (
                <Reveal key={p.id} index={i} step={90}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal as="h2">Produits en promotion</Reveal>
          {loading ? <Loader /> : promos.length === 0 ? (
            <p className="muted">Aucune promotion en cours.</p>
          ) : (
            <div className="product-grid">
              {promos.map((p, i) => (
                <Reveal key={p.id} index={i} step={90}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <Reveal as="h2">Pourquoi choisir ALTESS FASHION ?</Reveal>
          <div className="features-grid">
            <Reveal variant="left" index={0}>
              <div className="feature"><h3>Qualité Premium</h3><p>Matériaux haut de gamme.</p></div>
            </Reveal>
            <Reveal index={1}>
              <div className="feature"><h3>Livraison Rapide</h3><p>Partout au Cameroun.</p></div>
            </Reveal>
            <Reveal variant="right" index={2}>
              <div className="feature"><h3>Service Client</h3><p>Équipe dédiée.</p></div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <Reveal as="h2">Prêt pour l'élégance ?</Reveal>
          <Link to="/boutique" className="btn btn-primaire">Découvrir la collection</Link>
        </div>
      </section>
    </div>
  );
}
