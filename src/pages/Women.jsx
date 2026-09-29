import CatalogPage from '../components/catalog/CatalogPage.jsx';

export default function Women() {
  return (
    <CatalogPage
      lockedGender="female"
      title="Collection Femme"
      intro="Vêtements, chaussures, bijoux et sacs pour femmes. Élégance et style premium."
      emptyMessage="Aucun article femme n'est disponible pour le moment."
    />
  );
}
