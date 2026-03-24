import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { useCart } from '../CartContext';

export default function SuccessPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { clearCart, currency } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const cartCleared = useRef(false);
  const demoMode = location.state?.demoMode || searchParams.get('demo') === '1';

  useEffect(() => {
    if (cartCleared.current) return;
    cartCleared.current = true;
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const loadOrder = async () => {
      try {
        if (sessionId && !demoMode) {
          const response = await fetch(`/api/orders?session_id=${encodeURIComponent(sessionId)}`);
          if (!response.ok) {
            throw new Error('Failed to load order');
          }
          const data = await response.json();
          setOrder(data.order || data);
        }
      } catch (error) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (demoMode) {
      setLoading(false);
      return;
    }

    loadOrder();
  }, [searchParams, demoMode]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          {/* Decorative top bar */}
          <div style={styles.topAccent} />

          {/* Success Icon */}
          <div style={styles.iconWrapper}>
            <div style={styles.icon}>✓</div>
          </div>

          <h1 style={styles.title}>{t('success.title')}</h1>

          <p style={styles.message}>
            {demoMode ? 'Demo Mode — Order Placed Successfully!' : t('success.message')}
          </p>

          {order && (
            <div style={styles.orderDetails}>
              <div>Order: {order.id || order.order_id || '—'}</div>
              <div>Room: {order.room_number || '—'}</div>
              <div>Guest: {order.guest_name || '—'}</div>
              <div>Items: {Array.isArray(order.items) ? order.items.map((item) => `${item.name} x${item.quantity}`).join(', ') : '—'}</div>
              <div>Total: {order.total || '—'} {order.currency || currency}</div>
            </div>
          )}

          {/* Info strip */}
          <div style={styles.infoStrip}>
            <span style={styles.infoText}>
              Our team will prepare your order shortly. Sit back and relax!
            </span>
          </div>

          <div style={styles.actions}>
            <Link to="/" style={styles.primaryButton}>
              {t('success.newOrder')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: '#FAF9F7',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(1rem, 4vw, 2rem)',
  },
  container: {
    maxWidth: '560px',
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    textAlign: 'center',
    overflow: 'hidden',
    border: '1px solid #E8E3DB',
  },
  topAccent: {
    height: '6px',
    background: 'linear-gradient(90deg, #1E3A5F 0%, #10B981 50%, #059669 100%)',
  },
  iconWrapper: {
    padding: 'clamp(1.5rem, 5vw, 2.5rem) 2.5rem 0',
  },
  icon: {
    width: '90px',
    height: '90px',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    margin: '0 auto',
    boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
  },
  title: {
    color: '#1E3A5F',
    marginTop: '1.5rem',
    marginBottom: '0.75rem',
    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
    fontWeight: '800',
    padding: '0 clamp(1rem, 5vw, 2.5rem)',
  },
  message: {
    color: 'rgba(30,58,95,0.75)',
    fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
    marginBottom: '1.5rem',
    padding: '0 clamp(1rem, 5vw, 2.5rem)',
    lineHeight: 1.6,
  },
  infoStrip: {
    backgroundColor: '#D1FAE5',
    padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 5vw, 2.5rem)',
    margin: '0 0 2rem',
    border: '0',
    borderTop: '1px solid #6EE7B7',
    borderBottom: '1px solid #6EE7B7',
  },
  infoText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    padding: '0 clamp(1rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.5rem)',
  },
  primaryButton: {
    padding: '0.9rem 2.25rem',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '1rem',
    boxShadow: '0 3px 10px rgba(16,185,129,0.25)',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
    color: 'rgba(30,58,95,0.75)',
  },
  orderDetails: {
    textAlign: 'left',
    margin: '0 1.5rem 1.5rem',
    padding: '1rem',
    backgroundColor: '#F5F0E8',
    borderRadius: '8px',
    color: '#1E3A5F',
    lineHeight: 1.6,
  },
};
