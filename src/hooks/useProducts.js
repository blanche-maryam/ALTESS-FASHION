import { useEffect, useState } from 'react';
import { productService } from '../services/productService.js';

export function useProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll(filters);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [JSON.stringify(filters)]);

  return { products, loading, total, refetch: fetch };
}
