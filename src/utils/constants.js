export const PRODUCT_SORTS = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'name', label: 'Nom (A→Z)' },
  { value: 'name_desc', label: 'Nom (Z→A)' },
  { value: 'price', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'stock', label: 'Stock croissant' },
  { value: 'stock_desc', label: 'Stock décroissant' },
];

export const GENDERS = [
  { value: 'female', label: 'Femme' },
  { value: 'male', label: 'Homme' },
  { value: 'unisex', label: 'Unisexe' },
];

export const AUDIENCES = GENDERS;

export const ORDER_STATUSES = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'preparing', label: 'En préparation' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
];

export const PAYMENT_METHODS = [
  { value: 'cash_on_delivery', label: 'Paiement à la livraison' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
];

export const ORDER_FLOW = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];

export const USER_ROLES = [
  { value: 'customer', label: 'Client' },
  { value: 'admin', label: 'Administrateur' },
];

export function statusLabel(value) {
  return ORDER_STATUSES.find((s) => s.value === value)?.label || value || '—';
}
