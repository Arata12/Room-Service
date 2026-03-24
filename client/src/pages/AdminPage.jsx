import React, { useEffect, useMemo, useRef, useState } from 'react';

const statuses = ['all', 'pending', 'paid', 'received', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
const validStatuses = statuses.slice(1);

const statusColors = {
  pending:    { bg: '#FFF8E1', color: '#B45309', border: '#D97706' },
  paid:       { bg: '#D1FAE5', color: '#059669', border: '#10B981' },
  received:   { bg: '#EFF6FF', color: '#1E3A5F', border: '#3B7AC3' },
  preparing:  { bg: '#F5F3FF', color: '#5B21B6', border: '#7C3AED' },
  ready:      { bg: '#ECFEFF', color: '#0E7490', border: '#06B6D4' },
  delivering: { bg: '#FFF7ED', color: '#92400E', border: '#D97706' },
  delivered:  { bg: '#D1FAE5', color: '#059669', border: '#10B981' },
  cancelled:  { bg: '#FEF2F2', color: '#991B1B', border: '#EF4444' },
};

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const USD_TO_MXN_RATE = Number(import.meta.env.VITE_USD_TO_MXN_RATE) || 17.5;
  const debounceRef = useRef(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      if (search.trim()) qs.set('search', search.trim());
      const res = await fetch(`/api/admin/orders?${qs.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setMessage('Failed to load orders');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 10000);
    return () => clearInterval(id);
  }, [status, search]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const totalDisplay = (o) => {
    const total_display = o.currency === 'MXN'
      ? Number(o.total_usd * USD_TO_MXN_RATE).toFixed(2)
      : Number(o.total_usd).toFixed(2);
    return `$${total_display} ${o.currency}`;
  };

  const updateStatus = async (id, nextStatus) => {
    setMessage('Updating...');
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) { setMessage('Status updated'); fetchOrders(); }
    else { setMessage('Update failed'); }
  };

  const summary = (items = []) =>
    `${items.length} item${items.length !== 1 ? 's' : ''}: ${items.slice(0, 3).map((i) => i.item_name_en).join(', ')}${items.length > 3 ? '…' : ''}`;

  return (
    <>
      <style>{`
        .admin-filter-bar {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .admin-search {
          width: min(100%, 420px);
          padding: 0.7rem 0.9rem;
          border: 1px solid rgba(30,58,95,0.2);
          border-radius: 10px;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
        }
        .admin-row-clickable {
          cursor: pointer;
        }
        .admin-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid #E8E3DB;
        }
        @media (max-width: 768px) {
          .admin-container {
            padding: 1.25rem 0.875rem !important;
          }
          .admin-title {
            font-size: 1.5rem !important;
          }
          .admin-filter-btn {
            font-size: 0.78rem !important;
            padding: 0.35rem 0.75rem !important;
          }
          .admin-search {
            width: 100%;
          }
          .admin-th, .admin-td {
            padding: 0.6rem 0.75rem !important;
            font-size: 0.78rem !important;
          }
          .admin-select {
            font-size: 0.75rem !important;
            padding: 0.3rem 0.4rem !important;
          }
        }
      `}</style>
      <div style={styles.page}>
        <div className="admin-container" style={styles.container}>
          <h1 className="admin-title" style={styles.title}>Admin Orders</h1>

          <input
            className="admin-search"
            style={styles.search}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearch(searchInput);
            }}
            placeholder="Search by room number or guest name"
          />

          {/* Filter bar */}
          <div className="admin-filter-bar">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className="admin-filter-btn"
                style={{
                  ...styles.filterBtn,
                  ...(status === s ? styles.filterBtnActive : {}),
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Feedback message */}
          {message && (
            <div style={styles.messageBanner}>
              {message}
            </div>
          )}

          {/* Orders table */}
          {loading ? (
            <div style={styles.loading}>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div style={styles.emptyState}>No orders found for this filter.</div>
          ) : (
            <div className="admin-table-wrapper">
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th className="admin-th" style={styles.th}>ID</th>
                    <th className="admin-th" style={styles.th}>Room</th>
                    <th className="admin-th" style={styles.th}>Guest</th>
                    <th className="admin-th" style={styles.th}>Items</th>
                    <th className="admin-th" style={styles.th}>Total</th>
                    <th className="admin-th" style={styles.th}>Status</th>
                    <th className="admin-th" style={styles.th}>Time</th>
                    <th className="admin-th" style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, idx) => {
                    const sc = statusColors[o.status] || { bg: '#F5F5F5', color: '#555', border: '#CCC' };
                    return (
                      <tr
                        key={o.id}
                        className="admin-row-clickable"
                        style={{
                          ...styles.tr,
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAF8',
                        }}
                        onClick={(e) => {
                          if (e.target.closest('select')) return;
                          setSelectedOrder(o);
                        }}
                      >
                        <td className="admin-td" style={styles.td}>
                          <span style={styles.idChip}>#{o.id}</span>
                        </td>
                        <td className="admin-td" style={{ ...styles.td, fontWeight: '700', color: '#1E3A5F' }}>
                          {o.room_number}
                        </td>
                        <td className="admin-td" style={styles.td}>{o.guest_name}</td>
                        <td className="admin-td" style={{ ...styles.td, maxWidth: '220px', fontSize: '0.8rem', color: 'rgba(30,58,95,0.7)' }}>
                          {summary(o.items || [])}
                        </td>
                        <td className="admin-td" style={{ ...styles.td, fontWeight: '700', color: '#059669' }}>
                          {totalDisplay(o)}
                        </td>
                        <td className="admin-td" style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: sc.bg,
                            color: sc.color,
                            border: `1px solid ${sc.border}`,
                          }}>
                            {o.status}
                          </span>
                        </td>
                        <td className="admin-td" style={{ ...styles.td, fontSize: '0.78rem', color: '#5C6B7A', whiteSpace: 'nowrap' }}>
                          {new Date(o.created_at).toLocaleString()}
                        </td>
                        <td className="admin-td" style={styles.td}>
                          <select
                            value={o.status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            className="admin-select"
                            style={styles.select}
                          >
                            {validStatuses.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedOrder && (
            <div style={styles.modalBackdrop} onClick={() => setSelectedOrder(null)}>
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={styles.modalTitle}>Order #{selectedOrder.id}</h2>
                  <button style={styles.closeBtn} onClick={() => setSelectedOrder(null)}>×</button>
                </div>
                <div style={styles.modalGrid}>
                  <div><strong>Room:</strong> {selectedOrder.room_number}</div>
                  <div><strong>Guest:</strong> {selectedOrder.guest_name}</div>
                  <div><strong>Status:</strong> {selectedOrder.status}</div>
                  <div><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</div>
                  <div><strong>Notes:</strong> {selectedOrder.notes || '—'}</div>
                </div>
                <h3 style={styles.sectionTitle}>Items</h3>
                <div style={styles.itemsList}>
                  {(selectedOrder.items || []).map((item, index) => {
                    const lineTotal = Number(item.quantity * item.unit_price_usd).toFixed(2);
                    return (
                      <div key={`${item.item_id || index}-${index}`} style={styles.itemRow}>
                        <div>{item.quantity}× {item.item_name_en} / {item.item_name_es}</div>
                        <div>${Number(item.unit_price_usd).toFixed(2)} each</div>
                        <div>${lineTotal}</div>
                      </div>
                    );
                  })}
                </div>
                <h3 style={styles.sectionTitle}>Status history</h3>
                <div style={styles.historyBox}>{selectedOrder.status_history?.length ? JSON.stringify(selectedOrder.status_history) : 'No history yet'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    backgroundColor: '#FAF9F7',
    minHeight: '100vh',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(0.875rem, 4vw, 2rem)',
  },
  title: {
    color: '#1E3A5F',
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: '800',
    marginBottom: '1.75rem',
  },
  filterBtn: {
    padding: '0.4rem 1rem',
    border: '1px solid rgba(30,58,95,0.2)',
    borderRadius: '20px',
    backgroundColor: '#FAF9F7',
    color: 'rgba(30,58,95,0.75)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'all 0.15s',
    minHeight: '36px',
  },
  filterBtnActive: {
    backgroundColor: '#1E3A5F',
    color: '#FFFFFF',
    border: '1px solid #1E3A5F',
    fontWeight: '700',
  },
  messageBanner: {
    padding: '0.75rem 1.25rem',
    backgroundColor: '#D1FAE5',
    color: '#059669',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontWeight: '600',
    fontSize: '0.9rem',
    border: '1px solid #10B981',
  },
  loading: {
    padding: '3rem',
    textAlign: 'center',
    color: 'rgba(30,58,95,0.75)',
    fontSize: '1.1rem',
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    color: 'rgba(30,58,95,0.6)',
    backgroundColor: '#F5F0E8',
    borderRadius: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '700px',
  },
  tableHeadRow: {
    backgroundColor: '#F5F0E8',
  },
  th: {
    padding: '0.85rem 1rem',
    textAlign: 'left',
    color: '#1E3A5F',
    fontWeight: '700',
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid rgba(30,58,95,0.12)',
  },
  tr: {
    borderBottom: '1px solid #E8E3DB',
    transition: 'background-color 0.1s',
  },
  td: {
    padding: '0.85rem 1rem',
    color: '#3D4F5C',
    fontSize: '0.88rem',
    verticalAlign: 'middle',
  },
  idChip: {
    backgroundColor: '#EEE9E0',
    color: '#1E3A5F',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.8rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: '700',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
  },
  select: {
    padding: '0.4rem 0.6rem',
    border: '1px solid rgba(30,58,95,0.25)',
    borderRadius: '4px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.82rem',
    outline: 'none',
    minHeight: '36px',
  },
  search: {
    display: 'block',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 1000,
  },
  modal: {
    width: 'min(900px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { margin: 0, color: '#1E3A5F' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: '1.8rem', cursor: 'pointer' },
  modalGrid: { display: 'grid', gap: '0.5rem', marginTop: '1rem' },
  sectionTitle: { marginTop: '1rem', marginBottom: '0.5rem', color: '#1E3A5F' },
  itemsList: { display: 'grid', gap: '0.5rem' },
  itemRow: { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', padding: '0.6rem 0.75rem', background: '#FAF9F7', borderRadius: '8px' },
  historyBox: { padding: '0.75rem', background: '#FAF9F7', borderRadius: '8px', whiteSpace: 'pre-wrap' },
};
