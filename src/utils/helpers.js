// =============================================================================
// ALTESS FASHION — Utilitaires
// =============================================================================

export function formatPrice(price, currency = 'FCFA') {
  return new Intl.NumberFormat('fr-CM').format(price) + ' ' + currency;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
