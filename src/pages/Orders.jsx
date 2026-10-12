import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService.js';
import { extractError } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';
import { formatPrice, formatDate } from '../utils/helpers.js';
import { statusLabel, PAYMENT_METHODS } from '../utils/constants.js';
import Modal from '../components/admin/Modal.jsx';
import Reveal from '../components/Reveal.jsx';
import { imageUrl } from '../utils/images.js';

const PER_PAGE = 8;

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await orderService.getMine({ page, per_page: PER_PAGE });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
    } catch (err) {
      toast.error(extractError(err, 'Impossible de charger vos commandes'));
    } finally {
      setLoading(false);
    }
  }, [user, toast, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (order) => {
    setDetail({ ...order, items: null });
    setDetailLoading(true);
    try {
      const data = await orderService.getById(order.id);
      setDetail(data.order);
    } catch {
      toast.error('Impossible de charger le détail de la commande');
    } finally {
      setDetailLoading(false);
    }
  };

  if (authLoading) return <Loader />;
  if (!user) return null;

  return (
    <div className="container page-orders page-enter">
      <Reveal as="h1" className="page-title">Mes commandes</Reveal>
      <Reveal className="results-count" index={1} step={60}>
        {total} commande(s)
      </Reveal>

      {loading ? <Loader /> : orders.length === 0 ? (
        <Reveal className="empty-state">
          <h3>Aucune commande</h3>
          <p className="muted">Vous n'avez encore rien commandé.</p>
          <Link to="/boutique" className="btn btn-or">Découvrir la boutique</Link>
        </Reveal>
      ) : (
        orders.map((order, i) => (
          <Reveal key={order.id} index={i} step={80}>
            <div className="order-card">
              <div className="order-header">
                <span><strong>Commande :</strong> {order.order_number}</span>
                <span><strong>Date :</strong> {formatDate(order.created_at)}</span>
                <span><strong>Total :</strong> {formatPrice(order.total)}</span>
                <span className={`status status-${order.status}`}>{statusLabel(order.status)}</span>
                <button type="button" className="btn btn-contour btn-xs" onClick={() => openDetail(order)}>Détail</button>
              </div>
            </div>
          </Reveal>
        ))
      )}

      {pages > 1 && (
        <Pagination
          page={page}
          pages={pages}
          total={total}
          perPage={PER_PAGE}
          onChange={setPage}
          itemLabel="commande"
        />
      )}

      <Modal open={Boolean(detail)} title={detail ? `Commande ${detail.order_number}` : ''} onClose={() => setDetail(null)} size="lg">
        {detail && (
          <div className="order-detail">
            <dl className="detail-grid">
              <div><dt>Date</dt><dd>{formatDate(detail.created_at)}</dd></div>
              <div><dt>Statut</dt><dd><span className={`status status-${detail.status}`}>{statusLabel(detail.status)}</span></dd></div>
              <div><dt>Paiement</dt><dd>{PAYMENT_METHODS.find((p) => p.value === detail.payment_method)?.label || detail.payment_method}</dd></div>
              <div><dt>Adresse</dt><dd className="pre-line">{detail.shipping_address}</dd></div>
            </dl>

            {detailLoading && !detail.items ? (
              <p className="muted">Chargement…</p>
            ) : (
              <table className="admin-table compact">
                <thead><tr><th>Article</th><th>Variante</th><th className="right">Qté</th><th className="right">Total</th></tr></thead>
                <tbody>
                  {(detail.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="cell-product">
                          <img src={imageUrl(item.product_image) || '/product-placeholder.svg'} alt="" className="cell-thumb" />
                          <span>{item.product_name}</span>
                        </div>
                      </td>
                      <td>{[item.size, item.color].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="right">{item.quantity}</td>
                      <td className="right">{formatPrice(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="right total-row">Total</td><td className="right total-row">{formatPrice(detail.total)}</td></tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
