import { useCallback, useEffect, useState } from 'react';
import { orderService } from '../../services/orderService.js';
import { extractError } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ORDER_STATUSES, PAYMENT_METHODS, statusLabel } from '../../utils/constants.js';
import { formatPrice, formatDate } from '../../utils/helpers.js';
import { imageUrl } from '../../utils/images.js';
import Pagination from '../../components/admin/Pagination.jsx';
import Modal from '../../components/admin/Modal.jsx';

const DEFAULT_FILTERS = { search: '', status: '', from: '', to: '', page: 1, per_page: 20 };

function StatusSelect({ order, onChange, disabled }) {
  return (
    <select
      className="status-select"
      value={order.status}
      onChange={(e) => onChange(order, e.target.value)}
      disabled={disabled}
    >
      {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  );
}

export default function AdminOrders() {
  const toast = useToast();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 0, page: 1, per_page: 20 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll(filters);
      setOrders(data.orders || []);
      setMeta({ total: data.total || 0, pages: data.pages || 0, page: data.page || 1, per_page: data.per_page || filters.per_page });
    } catch (err) {
      toast.error(extractError(err, 'Impossible de charger les commandes'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setFilter = (field) => (event) => {
    setFilters((f) => ({ ...f, [field]: event.target.value, page: 1 }));
  };

  const changeStatus = async (order, status) => {
    const previous = order.status;
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
    setUpdatingId(order.id);
    try {
      await orderService.updateStatus(order.id, status);
      toast.success(`Commande ${order.order_number} : ${statusLabel(status)}`);
    } catch (err) {
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: previous } : o)));
      toast.error(extractError(err, 'Mise à jour impossible'));
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetail = async (order) => {
    setDetailLoading(true);
    setDetail({ ...order, items: order.items || null });
    try {
      const data = await orderService.getById(order.id);
      setDetail(data.order);
    } catch (err) {
      toast.error(extractError(err, 'Impossible de charger le détail'));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Commandes</h1>
          <p className="muted">{meta.total} commande(s)</p>
        </div>
      </header>

      <section className="admin-filters">
        <div className="filter-group grow">
          <label htmlFor="o-search">Recherche</label>
          <input
            id="o-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Numéro, client, email…"
          />
        </div>
        <div className="filter-group">
          <label htmlFor="o-status">Statut</label>
          <select id="o-status" value={filters.status} onChange={setFilter('status')}>
            <option value="">Tous</option>
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="o-from">Du</label>
          <input id="o-from" type="date" value={filters.from} onChange={setFilter('from')} />
        </div>
        <div className="filter-group">
          <label htmlFor="o-to">Au</label>
          <input id="o-to" type="date" value={filters.to} onChange={setFilter('to')} />
        </div>
        <button type="button" className="btn btn-contour" onClick={() => { setSearchInput(''); setFilters(DEFAULT_FILTERS); }}>
          Réinitialiser
        </button>
      </section>

      {loading ? (
        <p className="muted padding">Chargement…</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune commande</h3>
          <p className="muted">Les commandes passées sur la boutique apparaîtront ici.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>N° commande</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Articles</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.order_number}</strong></td>
                    <td>
                      {o.firstname} {o.lastname}
                      <div className="muted small">{o.email}</div>
                    </td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>{o.item_count ?? '—'}</td>
                    <td><strong>{formatPrice(o.total)}</strong></td>
                    <td>
                      <span className={`status status-${o.status}`}>{statusLabel(o.status)}</span>
                      <div className="status-change">
                        <StatusSelect
                          order={o}
                          onChange={changeStatus}
                          disabled={updatingId === o.id}
                        />
                      </div>
                    </td>
                    <td className="right">
                      <button type="button" className="btn btn-contour btn-xs" onClick={() => openDetail(o)}>
                        Détail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={meta.page}
            pages={meta.pages}
            total={meta.total}
            perPage={meta.per_page}
            itemLabel="commande"
            onChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}

      <Modal
        open={Boolean(detail)}
        title={detail ? `Commande ${detail.order_number}` : ''}
        onClose={() => setDetail(null)}
        size="lg"
        footer={detail && (
          <StatusSelect order={detail} onChange={(o, s) => { changeStatus(o, s); setDetail((d) => (d ? { ...d, status: s } : d)); }} disabled={updatingId === detail.id} />
        )}
      >
        {detail && (
          <div className="order-detail">
            <dl className="detail-grid">
              <div><dt>Client</dt><dd>{detail.firstname} {detail.lastname}</dd></div>
              <div><dt>Email</dt><dd>{detail.email}</dd></div>
              <div><dt>Téléphone</dt><dd>{detail.phone || '—'}</dd></div>
              <div><dt>Date</dt><dd>{formatDate(detail.created_at)}</dd></div>
              <div><dt>Paiement</dt><dd>{PAYMENT_METHODS.find((p) => p.value === detail.payment_method)?.label || detail.payment_method || '—'}</dd></div>
              <div>
                <dt>Statut</dt>
                <dd><span className={`status status-${detail.status}`}>{statusLabel(detail.status)}</span></dd>
              </div>
            </dl>

            <h4>Adresse de livraison</h4>
            <p className="pre-line">{detail.shipping_address}</p>

            {detail.notes && (
              <>
                <h4>Notes du client</h4>
                <p className="pre-line">{detail.notes}</p>
              </>
            )}

            <h4>Articles</h4>
            {detailLoading && !detail.items ? (
              <p className="muted">Chargement des articles…</p>
            ) : (
              <table className="admin-table compact">
                <thead>
                  <tr><th>Produit</th><th>Variante</th><th className="right">Qté</th><th className="right">Prix</th><th className="right">Total</th></tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="cell-product">
                          <img src={imageUrl(item.product_image) || '/product-placeholder.svg'} alt="" className="cell-thumb" />
                          <span>{item.product_name}</span>
                        </div>
                      </td>
                      <td>
                        {[item.size, item.color].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="right">{item.quantity}</td>
                      <td className="right">{formatPrice(item.unit_price)}</td>
                      <td className="right"><strong>{formatPrice(item.subtotal)}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={4} className="right">Sous-total</td><td className="right">{formatPrice(detail.subtotal)}</td></tr>
                  <tr><td colSpan={4} className="right total-row">Total</td><td className="right total-row">{formatPrice(detail.total)}</td></tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
