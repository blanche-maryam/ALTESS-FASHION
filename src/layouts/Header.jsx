import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useEffect, useState } from 'react';

import Brand from '../components/Brand.jsx';

export default function Header() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!totalItems) return;
    setBump(false);
    const t = requestAnimationFrame(() => setBump(true));
    return () => cancelAnimationFrame(t);
  }, [totalItems]);

  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="container header-inner">
        <Brand size={42} />
        <nav className={`nav-desktop ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Accueil</Link>
          <Link to="/boutique" className={location.pathname === '/boutique' ? 'active' : ''}>Boutique</Link>
          <Link to="/femme" className={location.pathname?.startsWith('/femme') ? 'active' : ''}>Femme</Link>
          <Link to="/homme" className={location.pathname?.startsWith('/homme') ? 'active' : ''}>Homme</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link>
          <Link to="/a-propos" className={location.pathname === '/a-propos' ? 'active' : ''}>À propos</Link>
        </nav>

        <div className="header-actions">
          <Link to="/boutique" className="icon-btn" title="Rechercher">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </Link>
          <Link to="/panier" className="icon-btn cart-btn" title="Panier">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            {totalItems > 0 && <span className={`cart-badge${bump ? ' cart-badge-animate' : ''}`}>{totalItems}</span>}
          </Link>
          {user ? (
            <div className="user-menu">
              {user.role === 'admin' && (
                <Link to="/admin" className="icon-btn" title="Espace administrateur" style={{ fontSize: '0.7rem' }}>
                  Admin
                </Link>
              )}
              <Link to="/mon-compte" className="icon-btn" title="Mon compte">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Link>
            </div>
          ) : (
            <Link to="/connexion" className="icon-btn" title="Mon compte">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
          )}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}