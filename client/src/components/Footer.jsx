import React from 'react';
import { Link } from 'react-router-dom';

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Top row: brand + links */}
        <div style={styles.topRow}>
          <div style={styles.brand}>
            <span style={styles.brandAccent}>●</span>
            <span style={styles.brandName}>Esmeralda Beach Resort</span>
            <p style={styles.tagline}>Exceptional dining, delivered to your door.</p>
          </div>

          <nav style={styles.links}>
            <Link to="/" style={styles.link}>Menu</Link>
            <Link to="/cart" style={styles.link}>Cart</Link>
          </nav>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Bottom row: copyright */}
        <div style={styles.bottomRow}>
          <span style={styles.copyright}>
            © {currentYear} Esmeralda Beach Resort. All rights reserved.
          </span>
          <span style={styles.byline}>
            Crafted with care for your comfort.
          </span>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    marginTop: 'auto',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem)',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  brandAccent: {
    color: '#34D399',
    fontSize: '0.85rem',
    marginBottom: '-0.2rem',
  },
  brandName: {
    fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: '-0.3px',
  },
  tagline: {
    margin: 0,
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.75)',
    fontStyle: 'italic',
  },
  links: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  link: {
    color: '#FFFFFF',
    textDecoration: 'none',
    fontSize: '0.92rem',
    fontWeight: '600',
    borderBottom: '2px solid transparent',
    paddingBottom: '2px',
    transition: 'border-color 0.15s',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: '1.25rem',
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  copyright: {
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.7)',
  },
  byline: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
};
