import { formatPrice } from '../utils/helpers.js';
import { imageUrl } from '../utils/images.js';

export default function CartItem({ item, onUpdate, onRemove }) {
  return (
    <div className="cart-item">
      <div className="cart-item-img">
        <img src={imageUrl(item.image) || '/product-placeholder.svg'} alt={item.name} />
      </div>
      <div className="cart-item-details">
        <h3>{item.name}</h3>
        {(item.size || item.color) && (
          <p className="cart-item-meta">
            {item.size && <span>Taille : {item.size}</span>}
            {item.size && item.color && ' | '}
            {item.color && <span>Couleur : {item.color}</span>}
          </p>
        )}
        <p className="cart-item-price">{formatPrice(item.price)}</p>
      </div>
      <div className="cart-item-qty">
        <button type="button" onClick={() => onUpdate(item.quantity - 1)} aria-label="Diminuer">−</button>
        <span>{item.quantity}</span>
        <button
          type="button"
          onClick={() => onUpdate(item.quantity + 1)}
          disabled={item.stock > 0 && item.quantity >= item.stock}
          aria-label="Augmenter"
        >
          +
        </button>
      </div>
      <div className="cart-item-subtotal">{formatPrice(item.price * item.quantity)}</div>
      <button type="button" className="cart-item-remove" onClick={onRemove} aria-label="Supprimer l'article">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  );
}
