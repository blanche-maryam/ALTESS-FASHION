import CatalogPage from '../components/catalog/CatalogPage.jsx';

export default function Men() {
  return (
    <CatalogPage
      lockedGender="male"
      title="Collection Homme"
      intro="Vêtements, chaussures et accessoires pour hommes. Style et sophistication."
      emptyMessage="Aucun article homme n'est disponible pour le moment."
    />
  );
}
