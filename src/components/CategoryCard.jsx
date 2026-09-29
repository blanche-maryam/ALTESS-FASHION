import { Link } from 'react-router-dom';
import { imageUrl } from '../utils/images.js';

export default function CategoryCard({ category }) {
  const href = category.id
    ? `/boutique?category_id=${category.id}`
    : `/boutique?gender=${category.target_audience}`;
  return (
    <Link to={href} className="category-card">
      <div className="category-img-wrapper">
        <img src={imageUrl(category.image) || '/product-placeholder.svg'} alt={category.name} loading="lazy" />
      </div>
      <h3>{category.name}</h3>
      <span className="product-count">{category.product_count || 0} produit(s)</span>
    </Link>
  );
}
