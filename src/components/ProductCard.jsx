import { Link } from 'react-router-dom';
import { productThumb } from '../utils/images.js';
import { formatPrice } from '../utils/helpers.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const hasPromo = product.old_price && Number(product.old_price) > Number(product.price);
  const outOfStock = Number(product.stock) === 0;

  return (
    <article className="product-card">
      <Link to={`/produit/${product.slug}`} className="product-img-link">
        <div className="product-img-wrapper">
          <img src={productThumb(product)} alt={product.name} loading="lazy" />
          {hasPromo && <span className="badge badge-or">Promo</span>}
          {outOfStock && <span className="badge badge-dark">Rupture</span>}
        </div>
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category_name || ''}</span>
        <h3><Link to={`/produit/${product.slug}`}>{product.name}</Link></h3>
        <div className="product-price">
          {formatPrice(product.price)}
          {hasPromo && <span className="old-price">{formatPrice(product.old_price)}</span>}
        </div>
        <button className="btn btn-or" onClick={() => addToCart({ ...product, size: null, color: null }, 1)} disabled={outOfStock}>
          {outOfStock ? 'Rupture' : 'Ajouter au panier'}
        </button>
      </div>
    </article>
  );
}
