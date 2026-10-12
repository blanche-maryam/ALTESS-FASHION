import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService.js';
import { extractError } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import CartItem from '../components/CartItem.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/helpers.js';
import Reveal from '../components/Reveal.jsx';
import { PAYMENT_METHODS } from '../utils/constants.js';

export default function Cart() {
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [shippingAddress, setShippingAddress] = useState('');
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Connectez-vous pour finaliser votre commande');
      navigate('/connexion');
      return;
    }
    if (!shippingAddress.trim()) {
      setError('Veuillez saisir votre adresse de livraison');
      return;
    }
    if (items.length === 0) {
      setError('Votre panier est vide');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await orderService.create({
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
      });
      clearCart();
      setOrderNumber(data.order_number || '');
      setOrderPlaced(true);
      toast.success('Commande enregistrée');
    } catch (err) {
      const message = extractError(err, 'Erreur lors de la commande');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="container page-cart">
        <div className="empty-cart">
          <h1 className="anim-scale-in page-title">Commande passée !</h1>
          {orderNumber && <p className="anim-rise-delay-1">Numéro de suivi : <strong>{orderNumber}</strong></p>}
          <p className="anim-rise-delay-2">Vous pouvez suivre son statut depuis votre espace.</p>
          <div className="checkout-actions anim-rise-delay-3">
            <Link to="/mes-commandes" className="btn btn-or">Mes commandes</Link>
            <Link to="/boutique" className="btn btn-contour">Continuer mes achats</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-cart page-enter">
      <Reveal as="h1" className="page-title">Mon panier ({totalItems})</Reveal>

      {items.length === 0 ? (
        <div className="empty-cart">
          <p>Votre panier est vide.</p>
          <Link to="/boutique" className="btn btn-or">Découvrir la boutique</Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((item, i) => (
              <Reveal key={`${item.product_id}-${item.size ?? ''}-${item.color ?? ''}`} index={i} step={70}>
                <CartItem
                  item={item}
                  onUpdate={(quantity) => updateQuantity(item.product_id, quantity, item.size, item.color)}
                  onRemove={() => removeFromCart(item.product_id, item.size, item.color)}
                />
              </Reveal>
            ))}
          </div>

          <Reveal index={items.length} step={70} className="cart-summary-wrap">
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Sous-total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </Reveal>

          <Reveal index={items.length + 1} step={70} className="checkout-section">
            {error && <p className="error-msg anim-shake">{error}</p>}
            <div className="champ">
              <label htmlFor="ship">Adresse de livraison</label>
              <textarea
                id="ship"
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Quartier, ville, téléphone…"
              />
            </div>
            <div className="champ">
              <label htmlFor="pay">Méthode de paiement</label>
              <select id="pay" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            {!user && <p className="muted">Une connexion est requise pour passer commande.</p>}
            <button type="button" className="btn btn-or btn-lg" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Traitement...' : 'Passer la commande'}
            </button>
          </Reveal>
        </>
      )}
    </div>
  );
}
