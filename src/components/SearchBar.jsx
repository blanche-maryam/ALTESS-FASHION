import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [, setParams] = useSearchParams();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setParams({ search: query.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="search"
        placeholder="Rechercher un produit..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Rechercher"
      />
      <button type="submit" className="btn btn-primaire" aria-label="Rechercher">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </button>
    </form>
  );
}