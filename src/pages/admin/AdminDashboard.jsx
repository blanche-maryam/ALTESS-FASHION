import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, extractError } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ORDER_STATUSES, statusLabel } from '../../utils/constants.js';
import { formatPrice, formatDate } from '../../utils/helpers.js';
import { productThumb } from '../../utils/images.js';

function Sparkline({ series }) {
  if (!series || series.length === 0) return null;
  const max = Math.max(...series.map((s) => s.total), 1);
  const width = 100;
  const height = 40;
  const step = width / Math.max(series.length - 1, 1);

  const points = series
    .map((s, i) => `${(i * step).toFixed(2)},${(height - (s.total / max) * height).toFixed(2)}`)
    .join(' ');

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/stats.php');
      setStats(res.data.stats);
    } catch (err) {
      toast.error(extractError(err, 'Impossible de charger les statistiques'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="muted padding">Chargement du tableau de bord…</p>;
  if (!stats) {
    return (
      <div className="empty-state">
        <h3>Statistiques indisponibles</h3>
        <p className="muted">Vérifiez la connexion à l'API puis réessayez.</p>
        <button type="button" className="btn btn-or" onClick={load}>Réessayer</button>
      </div>
    );
  }

  const cards = [
    { label: 'Chiffre d’affaires', value: formatPrice(stats.revenue), hint: `${stats.total_orders} commande(s)` },
    { label: 'Commandes actives', value: stats.active_orders, hint: `${stats.pending_orders_count} en attente` },
    { label: 'Panier moyen', value: formatPrice(stats.average_order_value), hint: 'hors commandes annulées' },
    { label: 'Produits en ligne', value: stats.active_products, hint: `${stats.products} au total` },
    { label: 'Clients', value: stats.customers, hint: 'comptes clients' },
    { label: 'Alertes stock', value: stats.low_stock, hint: 'stock ≤ 5' },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="muted">Vue d'ensemble de la boutique</p>
        </div>
        <button type="button" className="btn btn-contour" onClick={load}>Actualiser</button>
      </header>

      <section className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <h3>{c.label}</h3>
            <p>{c.value}</p>
            <span className="muted small">{c.hint}</span>
          </div>
        ))}
      </section>

      <div className="dashboard-split">
        <section className="panel">
          <header className="panel-header">
            <h2>Chiffre d'affaires (6 mois)</h2>
          </header>
          <div className="revenue-chart">
            <Sparkline series={stats.revenue_by_month} />
            <ul className="revenue-legend">
              {stats.revenue_by_month.map((m) => (
                <li key={m.month}>
                  <span className="muted small">{m.label}</span>
                  <strong>{formatPrice(m.total)}</strong>
                  <span className="muted small">{m.orders} cmd</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel">
          <header className="panel-header"><h2>Commandes par statut</h2></header>
          <ul className="bar-list">
            {ORDER_STATUSES.map((s) => {
              const count = stats.orders_by_status?.[s.value] || 0;
              const pct = stats.total_orders ? Math.round((count / stats.total_orders) * 100) : 0;
              return (
                <li key={s.value}>
                  <span className="bar-label">{s.label}</span>
                  <span className="bar-track"><span className={`bar-fill bar-${s.value}`} style={{ width: `${pct}%` }} /></span>
                  <span className="bar-value">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="dashboard-split">
        <section className="panel">
          <header className="panel-header">
            <h2>Dernières commandes</h2>
            <Link to="/admin/commandes" className="btn btn-contour btn-xs">Tout voir</Link>
          </header>
          {stats.recent_orders.length === 0 ? (
            <p className="muted">Aucune commande pour le moment.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table compact">
                <thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Total</th><th>Statut</th></tr></thead>
                <tbody>
                  {stats.recent_orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.order_number}</td>
                      <td>{o.firstname} {o.lastname}</td>
                      <td>{formatDate(o.created_at)}</td>
                      <td>{formatPrice(o.total)}</td>
                      <td><span className={`status status-${o.status}`}>{statusLabel(o.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <header className="panel-header">
            <h2>Alertes de stock</h2>
            <Link to="/admin/produits" className="btn btn-contour btn-xs">Gérer</Link>
          </header>
          {stats.low_stock_products.length === 0 ? (
            <p className="muted">Tous les stocks sont suffisants.</p>
          ) : (
            <ul className="mini-list">
              {stats.low_stock_products.map((p) => (
                <li key={p.id}>
                  <img src={productThumb(p)} alt="" className="cell-thumb" />
                  <div>
                    <strong>{p.name}</strong>
                    <span className="muted small">{formatPrice(p.price)}</span>
                  </div>
                  <span className={`stock-pill ${Number(p.stock) === 0 ? 'out' : 'low'}`}>{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {stats.top_products.length > 0 && (
        <section className="panel">
          <header className="panel-header"><h2>Meilleures ventes</h2></header>
          <div className="admin-table-wrap">
            <table className="admin-table compact">
              <thead><tr><th>Produit</th><th className="right">Quantité</th><th className="right">Chiffre d'affaires</th></tr></thead>
              <tbody>
                {stats.top_products.map((p) => (
                  <tr key={p.product_id}>
                    <td>{p.product_name}</td>
                    <td className="right">{p.qty}</td>
                    <td className="right">{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
