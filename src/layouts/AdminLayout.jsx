import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation, NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/authService.js';
import Brand from '../components/Brand.jsx';

const NAV = [
  { to: '/admin', label: 'Tableau de bord', icon: '▦', end: true },
  { to: '/admin/produits', label: 'Produits', icon: '▣' },
  { to: '/admin/categories', label: 'Catégories', icon: '◈' },
  { to: '/admin/commandes', label: 'Commandes', icon: '▤' },
  { to: '/admin/clients', label: 'Clients', icon: '☺' },
  { to: '/', label: 'Voir la boutique', icon: '↗', external: true },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // la session locale est nettoyée dans tous les cas
    }
    logout();
    navigate('/connexion', { replace: true });
  }, [logout, navigate]);

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <Brand size={34} />
          <span className="admin-brand-sub">Administration</span>
        </div>

        <nav className="admin-nav">
          {NAV.map((item) =>
            item.external ? (
              <Link key={item.to} to={item.to} className="admin-nav-link">
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-user">
            <span className="admin-user-name">
              {user?.firstname} {user?.lastname}
            </span>
            <span className="admin-user-role">{user?.email}</span>
          </div>
          <button type="button" className="btn btn-contour btn-block" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="admin-scrim" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-burger"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
          <span className="admin-topbar-title">Espace administrateur</span>
          <Link to="/admin/produits" className="btn btn-or btn-sm">
            + Nouveau produit
          </Link>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
