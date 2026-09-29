const PLACEHOLDER = '/product-placeholder.svg';

export function imageUrl(path) {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  if (/^https?:\/\//i.test(path) || path.startsWith('/src/') || path.startsWith('data:')) return path;
  const clean = path.replace(/^\/+/, '');
  if (clean.startsWith('altess-fashion/')) return '/' + clean;
  return '/altess-fashion/public/uploads/' + clean;
}

export function firstImage(product) {
  if (!product) return null;
  if (Array.isArray(product.images) && product.images.length) {
    const primary = product.images.find((i) => Number(i.is_primary) === 1) || product.images[0];
    return imageUrl(typeof primary === 'string' ? primary : primary.image_path);
  }
  return imageUrl(product.main_image) || imageUrl(product.image) || null;
}

export function productThumb(product, fallback = PLACEHOLDER) {
  return firstImage(product) || fallback;
}

export { PLACEHOLDER };
