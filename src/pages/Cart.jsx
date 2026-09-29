import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService.js';
import { extractError } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import CartItem from '../components/CartItem.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/helpers.js';
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
          <h1>Commande passée !</h1>
          {orderNumber && <p>Numéro de suivi : <strong>{orderNumber}</strong></p>}
          <p>Vous pouvez suivre son statut depuis votre espace.</p>
          <div className="checkout-actions">
            <Link to="/mes-commandes" className="btn btn-or">Mes commandes</Link>
            <Link to="/boutique" className="btn btn-contour">Continuer mes achats</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-cart">
      <h1>Mon panier ({totalItems})</h1>

      {items.length === 0 ? (
        <div className="empty-cart">
          <p>Votre panier est vide.</p>
          <Link to="/boutique" className="btn btn-or">Découvrir la boutique</Link>
        </div>
      ) : (
        <>
          {items.map((item) => (
            <CartItem
              key={`${item.product_id}-${item.size ?? ''}-${item.color ?? ''}`}
              item={item}
              onUpdate={(quantity) => updateQuantity(item.product_id, quantity, item.size, item.color)}
              onRemove={() => removeFromCart(item.product_id, item.size, item.color)}
            />
          ))}

          <div className="cart-summary">
            <div className="cart-row"><span>Sous-total</span><span>{formatPrice(totalPrice)}</span></div>
            <div className="cart-row"><span>Livraison</span><span>Gratuite</span></div>
            <div className="cart-row cart-total"><span>Total</span><span>{formatPrice(totalPrice)}</span></div>
          </div>

          <div className="checkout-section">
            {error && <p className="error-msg">{error}</p>}
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
          </div>
        </>
      )}
    </div>
  );
}
