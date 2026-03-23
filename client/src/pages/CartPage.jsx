import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../CartContext';
import GuestForm from '../components/GuestForm';
import { Link } from 'react-router-dom';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { cart, removeFromCart, updateQuantity, clearCart, getTotal, formatPrice } = useCart();
  const getLang = (lang) => lang.split('-')[0];

  if (cart.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🛒</div>
            <h2 style={styles.emptyTitle}>{t('cart.empty')}</h2>
            <Link to="/" style={styles.linkButton}>
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem;
          align-items: start;
        }
        .cart-row-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 80px;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #E8E3DB;
          align-items: center;
        }
        .cart-header-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 80px;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 2px solid #E8E3DB;
          font-weight: 700;
          color: #1E3A5F;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        @media (max-width: 600px) {
          .cart-layout {
            grid-template-columns: 1fr !important;
          }
          .cart-header-grid {
            display: none !important;
          }
          .cart-row-grid {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.6rem !important;
            padding: 1rem 0 !important;
          }
          .cart-row-price-col {
            font-size: 1.1rem !important;
          }
          .cart-qty-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .cart-remove-btn {
            align-self: flex-end;
          }
          .cart-footer-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
        }
        @media (min-width: 601px) and (max-width: 960px) {
          .cart-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>{t('cart.title')}</h1>

          <div className="cart-layout">
            <div style={styles.cartSection}>
              <div className="cart-header-grid">
                <span>{t('cart.item')}</span>
                <span>{t('cart.quantity')}</span>
                <span>{t('cart.price')}</span>
                <span></span>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="cart-row-grid">
                  <div style={styles.colItem}>
                    <strong style={styles.itemName}>{item.name[getLang(i18n.language)]}</strong>
                    <p style={styles.itemDesc}>{item.description[getLang(i18n.language)]}</p>
                  </div>
                  <div className="cart-qty-row" style={styles.colQty}>
                    <button
                      style={styles.qtyButton}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span style={styles.qtyValue}>{item.quantity}</span>
                    <button
                      style={styles.qtyButton}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-row-price-col" style={styles.colPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  <button
                    className="cart-remove-btn"
                    style={styles.removeButton}
                    onClick={() => removeFromCart(item.id)}
                  >
                    {t('cart.remove')}
                  </button>
                </div>
              ))}

              <div className="cart-footer-row" style={styles.cartFooter}>
                <button style={styles.clearButton} onClick={clearCart}>
                  {t('cart.clearCart')}
                </button>
                <div style={styles.total}>
                  {t('cart.total')}:{' '}
                  <strong style={styles.totalAmount}>{formatPrice(getTotal())}</strong>
                </div>
              </div>

              <Link to="/" style={styles.backLink}>
                ← {t('cart.continueShopping')}
              </Link>
            </div>

            <div style={styles.formSection}>
              <GuestForm />
            </div>
          </div>
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(0.875rem, 4vw, 2rem)',
  },
  title: {
    color: '#1E3A5F',
    marginBottom: '2rem',
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: '800',
  },
  emptyState: {
    textAlign: 'center',
    padding: 'clamp(2.5rem, 8vw, 5rem) 2rem',
    backgroundColor: '#F5F0E8',
    borderRadius: '12px',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    color: '#1E3A5F',
    fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
    marginBottom: '1.5rem',
  },
  linkButton: {
    display: 'inline-block',
    marginTop: '0.5rem',
    padding: '0.75rem 1.75rem',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    minHeight: '44px',
    lineHeight: '1.4',
  },
  cartSection: {
    backgroundColor: '#FFFFFF',
    padding: 'clamp(1rem, 3vw, 1.75rem)',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #E8E3DB',
    overflowX: 'auto',
  },
  colItem: {
    minWidth: 0,
  },
  colQty: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  colPrice: {
    fontWeight: 'bold',
    color: '#059669',
    fontSize: '1rem',
  },
  itemName: {
    color: '#1E3A5F',
  },
  itemDesc: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.85rem',
    color: 'rgba(30,58,95,0.75)',
  },
  qtyButton: {
    width: '36px',
    height: '36px',
    border: '1px solid #E8E3DB',
    backgroundColor: '#FAF9F7',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    color: '#1E3A5F',
    fontWeight: 'bold',
    minWidth: '44px',
    minHeight: '44px',
  },
  qtyValue: {
    minWidth: '30px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#2C3E50',
  },
  removeButton: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#F5F0E8',
    color: '#1E3A5F',
    border: '1px solid rgba(30,58,95,0.15)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    minHeight: '44px',
    whiteSpace: 'nowrap',
  },
  cartFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1.25rem',
    marginTop: '1rem',
    borderTop: '2px solid #E8E3DB',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  clearButton: {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#F5F0E8',
    color: '#1E3A5F',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    minHeight: '44px',
  },
  total: {
    fontSize: '1.25rem',
    color: '#2C3E50',
  },
  totalAmount: {
    color: '#059669',
    fontSize: '1.35rem',
  },
  backLink: {
    display: 'inline-block',
    marginTop: '1rem',
    color: 'rgba(30,58,95,0.75)',
    textDecoration: 'none',
    fontWeight: '500',
    minHeight: '44px',
    lineHeight: '2.5',
  },
  formSection: {
    width: '100%',
  },
};
