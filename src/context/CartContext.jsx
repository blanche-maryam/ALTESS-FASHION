import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { firstImage } from '../utils/images.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((product, quantity = 1, size = null, color = null) => {
    const itemSize = size || product.size || null;
    const itemColor = color || product.color || null;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    setItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.product_id === product.id &&
          item.size === itemSize &&
          item.color === itemColor
      );
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id && item.size === itemSize && item.color === itemColor
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          slug: product.slug || null,
          name: product.name,
          price: Number(product.price) || 0,
          image: firstImage(product),
          stock: Number(product.stock) || 0,
          quantity: qty,
          size: itemSize,
          color: itemColor,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId, size = null, color = null) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.product_id === productId && item.size === (size || null) && item.color === (color || null))
      )
    );
  }, []);

  const updateQuantity = useCallback((productId, quantity, size = null, color = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId && item.size === (size || null) && item.color === (color || null)
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
