import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import Reveal from '../components/Reveal.jsx';
import { productService } from '../services/productService.js';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/helpers.js';
import { productThumb, imageUrl } from '../utils/images.js';

export default function ProductDetails() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState({ size: '', color: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setQuantity(1);
    setActiveImage(0);
    setSelectedVariant({ size: '', color: '' });

    productService.getBySlug(slug)
      .then(async (data) => {
        if (cancelled) return;
        if (!data.product) {
          setNotFound(true);
          return;
        }
        setProduct(data.product);
        const variants = data.product.variants || [];
        if (variants.length) {
          setSelectedVariant({ size: variants[0].size || '', color: variants[0].color || '' });
        }
        const related = await productService.getAll({ category_id: data.product.category_id, per_page: 5 });
        if (cancelled) return;
        setSimilar((related.products || []).filter((p) => p.id !== data.product.id).slice(0, 4));
      })
      .catch(() => {
        if (cancelled) return;
        setNotFound(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <Loader />;

  if (notFound || !product) {
    return (
      <div className="container padding">
        <h1 className="page-title">Produit introuvable</h1>
        <p className="muted">Ce produit n'existe pas ou n'est plus disponible.</p>
        <Link to="/boutique" className="btn btn-or">Découvrir la boutique</Link>
      </div>
    );
  }

  const images = (product.images || []).map((img) => imageUrl(typeof img === 'string' ? img : img.image_path)).filter(Boolean);
  const gallery = images.length ? images : [productThumb(product)];
  const variants = product.variants || [];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  const selected = variants.find(
    (v) => (!selectedVariant.size || v.size === selectedVariant.size) && (!selectedVariant.color || v.color === selectedVariant.color)
  );
  const availableStock = selected ? Number(selected.stock) : Number(product.stock);
  const hasPromo = product.old_price && Number(product.old_price) > Number(product.price);
  const maxQuantity = Math.max(1, Math.min(availableStock, 10));

  const cartItem = {
    ...product,
    size: selectedVariant.size || selected?.size || null,
    color: selectedVariant.color || selected?.color || null,
  };

  return (
    <div className="container page-product-details">
      <nav className="breadcrumb">
        <Link to="/">Accueil</Link> <span>/</span>
        <Link to={`/boutique?gender=${product.gender}`}>Boutique</Link> <span>/</span>
        <span>{product.category_name || 'Produit'}</span>
      </nav>

      <div className="product-detail-grid">
        <Reveal variant="left" className="product-detail-media">
          <div className="product-main-img">
            <img src={gallery[activeImage] || productThumb(product)} alt={product.name} />
            {hasPromo && <span className="badge badge-or">-{Math.round((1 - product.price / product.old_price) * 100)}%</span>}
          </div>
          {gallery.length > 1 && (
            <ul className="gallery-thumbs">
              {gallery.map((src, index) => (
                <li key={src}>
                  <button
                    type="button"
                    className={`gallery-thumb ${index === activeImage ? 'active' : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={src} alt="" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal variant="right" className="product-detail-info">
          <span className="product-category">{product.category_name}</span>
          <h1>{product.name}</h1>

          <div className="product-price">
            {formatPrice(product.price)}
            {hasPromo && <span className="old-price">{formatPrice(product.old_price)}</span>}
          </div>

          <p>{product.short_description || product.description || 'Produit premium ALTESS FASHION.'}</p>

          {product.description && product.short_description && (
            <details className="product-description">
              <summary>Description complète</summary>
              <p className="pre-line">{product.description}</p>
            </details>
          )}

          {sizes.length > 0 && (
            <div className="filter-group">
              <label>Taille</label>
              <div className="option-row">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`option ${selectedVariant.size === size ? 'active' : ''}`}
                    onClick={() => setSelectedVariant((v) => ({ ...v, size }))}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="filter-group">
              <label>Couleur</label>
              <div className="option-row">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`option ${selectedVariant.color === color ? 'active' : ''}`}
                    onClick={() => setSelectedVariant((v) => ({ ...v, color }))}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filter-group">
            <label htmlFor="qty">Quantité</label>
            <div className="qty-control">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
              <span id="qty">{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} disabled={quantity >= maxQuantity}>+</button>
            </div>
          </div>

          <p className={`stock-info ${availableStock === 0 ? 'out' : ''}`}>
            {availableStock === 0 ? 'Rupture de stock' : availableStock <= 5 ? `Plus que ${availableStock} article(s)` : `${availableStock} articles disponibles`}
          </p>

          <button
            className="btn btn-or btn-lg"
            onClick={() => addToCart(cartItem, quantity)}
            disabled={availableStock === 0}
          >
            {availableStock === 0 ? 'Indisponible' : 'Ajouter au panier'}
          </button>
        </Reveal>
      </div>

      {similar.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <Reveal as="h2">Vous aimerez aussi</Reveal>
            <div className="product-grid">
              {similar.map((p, i) => (
                <Reveal key={p.id} index={i} step={80}>
                  <article className="product-card">
                    <Link to={`/produit/${p.slug}`} className="product-img-link">
                      <div className="product-img-wrapper">
                        <img src={productThumb(p)} alt={p.name} loading="lazy" />
                        {p.old_price && Number(p.old_price) > Number(p.price) && <span className="badge badge-or">Promo</span>}
                      </div>
                    </Link>
                    <div className="product-info">
                      <span className="product-category">{p.category_name}</span>
                      <h3><Link to={`/produit/${p.slug}`}>{p.name}</Link></h3>
                      <div className="product-price">
                        {formatPrice(p.price)}
                        {p.old_price && Number(p.old_price) > Number(p.price) && <span className="old-price">{formatPrice(p.old_price)}</span>}
                      </div>
                      <button className="btn btn-or" onClick={() => { addToCart({ ...p, size: null, color: null }, 1); navigate('/panier'); }} disabled={Number(p.stock) === 0}>
                        {Number(p.stock) === 0 ? 'Rupture' : 'Ajouter au panier'}
                      </button>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
