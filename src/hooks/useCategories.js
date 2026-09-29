import { useEffect, useState } from 'react';
import { categoryService } from '../services/categoryService.js';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getAll().then((data) => {
      setCategories(data.categories || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return { categories, loading };
}
