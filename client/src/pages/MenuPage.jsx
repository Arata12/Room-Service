import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MenuCard from '../components/MenuCard';

export default function MenuPage() {
  const { t, i18n } = useTranslation();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const getLang = (lang) => lang.split('-')[0];

  useEffect(() => {
    const controller = new AbortController();

    const loadMenu = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/menu', { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Failed to load menu (${response.status})`);
        }

        const data = await response.json();
        setMenu(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Unable to load the menu right now. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadMenu();

    return () => controller.abort();
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  if (error) {
    return (
      <div style={styles.loading}>
        <p>{error}</p>
        <button style={styles.retryButton} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!menu) return null;

  return (
    <>
      <style>{`
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 600px) {
          .menu-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .menu-page-container {
            padding: 1.25rem 0.875rem !important;
          }
          .menu-page-title {
            font-size: 1.6rem !important;
            margin-bottom: 1.75rem !important;
          }
          .menu-category-title {
            font-size: 1.35rem !important;
          }
          .menu-subcategory {
            padding: 1rem !important;
          }
          .menu-subcategory-title {
            font-size: 1.05rem !important;
          }
        }
        @media (min-width: 601px) and (max-width: 900px) {
          .menu-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 901px) {
          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          }
        }
      `}</style>
      <div style={styles.page}>
        <div className="menu-page-container" style={styles.container}>
          <h1 className="menu-page-title" style={styles.title}>{t('menu.title')}</h1>

          {menu.categories.map((category) => (
            <div key={category.id} style={styles.category}>
              <h2 className="menu-category-title" style={styles.categoryTitle}>
                {category.name[getLang(i18n.language)]}
              </h2>

              {category.subcategories.map((sub) => (
                <div key={sub.id} className="menu-subcategory" style={styles.subcategory}>
                  <h3 className="menu-subcategory-title" style={styles.subcategoryTitle}>
                    {sub.name[getLang(i18n.language)]}
                  </h3>
                  <div className="menu-grid">
                    {sub.items.map((item) => (
                      <MenuCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
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
    textAlign: 'center',
    color: '#1E3A5F',
    marginBottom: '2.5rem',
    fontSize: '2.25rem',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  category: {
    marginBottom: '3.5rem',
  },
  categoryTitle: {
    color: '#1E3A5F',
    borderBottom: '3px solid #34D399',
    paddingBottom: '0.6rem',
    marginBottom: '1.75rem',
    fontSize: '1.75rem',
    fontWeight: '700',
  },
  subcategory: {
    marginBottom: '2rem',
    backgroundColor: '#F5F0E8',
    borderRadius: '10px',
    padding: 'clamp(1rem, 3vw, 1.5rem)',
  },
  subcategoryTitle: {
    color: 'rgba(30,58,95,0.8)',
    marginBottom: '1.25rem',
    fontSize: '1.2rem',
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: 'rgba(30,58,95,0.75)',
    backgroundColor: '#FAF9F7',
    minHeight: '100vh',
  },
};
