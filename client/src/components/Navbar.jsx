import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../CartContext';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, cart } = useCart();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleMouseDown = (event) => {
      const target = event.target;
      const insideDropdown = target.closest?.('[data-navbar-dropdown="true"]');
      if (!insideDropdown) {
        setShowLangMenu(false);
        setShowCurrencyMenu(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setShowLangMenu(false);
  };

  const changeCurrency = (curr) => {
    setCurrency(curr);
    setShowCurrencyMenu(false);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav style={styles.navbar}>
      {/* Logo */}
      <div style={styles.logoWrapper}>
        <span style={styles.logoAccent}>●</span>
        <span style={styles.logo}>Esmeralda Beach Resort</span>
      </div>

      <div style={styles.controls}>
        {/* Currency Toggle */}
        <div style={styles.dropdownContainer} data-navbar-dropdown="true">
          <button
            style={styles.button}
            onClick={() => {
              setShowCurrencyMenu(!showCurrencyMenu);
              setShowLangMenu(false);
            }}
          >
            {currency} ▾
          </button>
          {showCurrencyMenu && (
            <div style={styles.dropdown}>
              <button style={styles.dropdownItem} onClick={() => changeCurrency('USD')}>
                USD — Dollar
              </button>
              <button style={styles.dropdownItem} onClick={() => changeCurrency('MXN')}>
                MXN — Peso
              </button>
            </div>
          )}
        </div>

        {/* Language Toggle */}
        <div style={styles.dropdownContainer} data-navbar-dropdown="true">
          <button
            style={styles.button}
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowCurrencyMenu(false);
            }}
          >
            {i18n.language.split('-')[0].toUpperCase()} ▾
          </button>
          {showLangMenu && (
            <div style={styles.dropdown}>
              <button style={styles.dropdownItem} onClick={() => changeLanguage('en')}>
                English
              </button>
              <button style={styles.dropdownItem} onClick={() => changeLanguage('es')}>
                Español
              </button>
            </div>
          )}
        </div>

        {/* Cart Icon */}
        <Link to="/cart" style={styles.cartLink}>
          <span style={styles.cartIcon}>🛒</span>
          {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
        </Link>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .navbar-inner {
            flex-wrap: wrap;
            padding: 0.6rem 1rem !important;
            gap: 0.5rem;
          }
        }
      `}</style>
    </nav>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(0.6rem, 2vw, 0.9rem) clamp(1rem, 4vw, 2rem)',
    backgroundColor: '#10B981',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  logoAccent: {
    color: '#34D399',
    fontSize: '1rem',
  },
  logo: {
    fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: '-0.3px',
  },
  controls: {
    display: 'flex',
    gap: 'clamp(0.4rem, 1.5vw, 0.75rem)',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dropdownContainer: {
    position: 'relative',
  },
  button: {
    padding: 'clamp(0.4rem, 1vw, 0.45rem) clamp(0.6rem, 2vw, 1rem)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: 'clamp(0.78rem, 2vw, 0.85rem)',
    fontWeight: '600',
    minWidth: '56px',
    minHeight: '44px',
    letterSpacing: '0.3px',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 200,
    minWidth: '130px',
    overflow: 'hidden',
    border: '1px solid #E8E3DB',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '0.65rem 1rem',
    backgroundColor: 'transparent',
    color: '#1E3A5F',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: '500',
    borderBottom: '1px solid #E8E3DB',
    minHeight: '44px',
  },
  cartLink: {
    color: '#FFFFFF',
    textDecoration: 'none',
    fontSize: '1.3rem',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem',
    minWidth: '44px',
    minHeight: '44px',
    justifyContent: 'center',
  },
  cartIcon: {
    lineHeight: 1,
  },
  badge: {
    position: 'absolute',
    top: '-6px',
    right: '-8px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: '800',
    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
  },
};
