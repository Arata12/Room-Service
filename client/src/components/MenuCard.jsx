import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../CartContext';

export default function MenuCard({ item }) {
  const { t, i18n } = useTranslation();
  const { addToCart, formatPrice, cart } = useCart();
  const [added, setAdded] = React.useState(false);
  const getLang = (lang) => lang.split('-')[0];

  const inCart = cart.find((i) => i.id === item.id)?.quantity || 0;

  const handleAdd = () => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  };

  return (
    <>
      <style>{`
        .menu-card {
          background-color: #FFFFFF;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          padding: clamp(1rem, 3vw, 1.5rem);
          border: 1px solid #E8E3DB;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .menu-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(30,58,95,0.1);
        }
        .menu-card-btn {
          padding: 0.55rem 1rem;
          color: #FFFFFF;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: clamp(0.8rem, 2vw, 0.88rem);
          font-weight: 700;
          transition: background-color 0.2s, box-shadow 0.2s;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          min-height: 44px;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .menu-card-footer {
            flex-direction: column;
            align-items: stretch !important;
            gap: 0.75rem;
          }
          .menu-card-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
      <div className="menu-card">
        <div style={styles.content}>
          <h3 style={styles.name}>{item.name[getLang(i18n.language)]}</h3>
          <p style={styles.description}>{item.description[getLang(i18n.language)]}</p>
          <div className="menu-card-footer" style={styles.footer}>
            <span style={styles.price}>{formatPrice(item.price)}</span>
            <button
              className="menu-card-btn"
              style={{
                backgroundColor: added ? '#059669' : '#10B981',
                boxShadow: added
                  ? '0 2px 8px rgba(5,150,105,0.3)'
                  : '0 2px 8px rgba(16,185,129,0.25)',
              }}
              onClick={handleAdd}
            >
              {added ? t('menu.added') : t('menu.addToCart')}
              {inCart > 0 && <span style={styles.cartBadge}>{inCart}</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  name: {
    margin: 0,
    fontSize: 'clamp(0.98rem, 2.5vw, 1.1rem)',
    fontWeight: '700',
    color: '#1E3A5F',
  },
  description: {
    margin: 0,
    color: 'rgba(30,58,95,0.75)',
    fontSize: 'clamp(0.82rem, 2vw, 0.88rem)',
    lineHeight: 1.5,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
  },
  price: {
    fontSize: 'clamp(1.05rem, 2.5vw, 1.2rem)',
    fontWeight: '800',
    color: '#059669',
  },
  cartBadge: {
    backgroundColor: '#1E3A5F',
    color: '#FFFFFF',
    borderRadius: '10px',
    padding: '0.1rem 0.45rem',
    fontSize: '0.72rem',
    fontWeight: '800',
  },
};
