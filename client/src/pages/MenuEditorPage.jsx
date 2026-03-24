import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function generateId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function MenuEditorPage() {
  const { t } = useTranslation();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Currently selected context
  const [selectedType, setSelectedType] = useState(null); // 'category' | 'subcategory' | 'item'
  const [selectedCatIdx, setSelectedCatIdx] = useState(null);
  const [selectedSubIdx, setSelectedSubIdx] = useState(null);
  const [selectedItemIdx, setSelectedItemIdx] = useState(null);

  // Edit state (draft before saving)
  const [edit, setEdit] = useState({});

  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(data => setMenu(data))
      .catch(() => setError(t('menuEditor.loadError')))
      .finally(() => setLoading(false));
  }, []);

  function selectCategory(idx) {
    setSelectedType('category');
    setSelectedCatIdx(idx);
    setSelectedSubIdx(null);
    setSelectedItemIdx(null);
    setEdit({ ...menu.categories[idx] });
  }

  function selectSubcategory(catIdx, subIdx) {
    setSelectedType('subcategory');
    setSelectedCatIdx(catIdx);
    setSelectedSubIdx(subIdx);
    setSelectedItemIdx(null);
    setEdit({ ...menu.categories[catIdx].subcategories[subIdx] });
  }

  function selectItem(catIdx, subIdx, itemIdx) {
    setSelectedType('item');
    setSelectedCatIdx(catIdx);
    setSelectedSubIdx(subIdx);
    setSelectedItemIdx(itemIdx);
    setEdit({ ...menu.categories[catIdx].subcategories[subIdx].items[itemIdx] });
  }

  function saveField(path, value) {
    setEdit(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function applyEdit() {
    const m = JSON.parse(JSON.stringify(menu));
    if (selectedType === 'category') {
      m.categories[selectedCatIdx] = { ...edit };
    } else if (selectedType === 'subcategory') {
      m.categories[selectedCatIdx].subcategories[selectedSubIdx] = { ...edit };
    } else {
      m.categories[selectedCatIdx].subcategories[selectedSubIdx].items[selectedItemIdx] = { ...edit };
    }
    return m;
  }

  // Add helpers
  function addCategory() {
    const id = generateId(t('menuEditor.newCategory'));
    const cat = { id, name: { en: t('menuEditor.newCategory'), es: t('menuEditor.newCategory') }, subcategories: [] };
    const m = { ...menu, categories: [...menu.categories, cat] };
    setMenu(m);
    selectCategory(m.categories.length - 1);
  }

  function addSubcategory() {
    const id = generateId(t('menuEditor.newSubcategory'));
    const sub = { id, name: { en: t('menuEditor.newSubcategory'), es: t('menuEditor.newSubcategory') }, items: [] };
    const m = JSON.parse(JSON.stringify(menu));
    m.categories[selectedCatIdx].subcategories.push(sub);
    setMenu(m);
    selectSubcategory(selectedCatIdx, m.categories[selectedCatIdx].subcategories.length - 1);
  }

  function addItem() {
    const id = generateId(t('menuEditor.newItem'));
    const item = { id, name: { en: t('menuEditor.newItem'), es: t('menuEditor.newItem') }, description: { en: '', es: '' }, price: 0 };
    const m = JSON.parse(JSON.stringify(menu));
    m.categories[selectedCatIdx].subcategories[selectedSubIdx].items.push(item);
    setMenu(m);
    selectItem(selectedCatIdx, selectedSubIdx, m.categories[selectedCatIdx].subcategories[selectedSubIdx].items.length - 1);
  }

  function deleteSelected() {
    if (!window.confirm(t('menuEditor.confirmDelete'))) return;
    const m = JSON.parse(JSON.stringify(menu));
    if (selectedType === 'category') {
      m.categories.splice(selectedCatIdx, 1);
      setMenu(m);
      clearSelection();
    } else if (selectedType === 'subcategory') {
      m.categories[selectedCatIdx].subcategories.splice(selectedSubIdx, 1);
      setMenu(m);
      clearSelection();
    } else {
      m.categories[selectedCatIdx].subcategories[selectedSubIdx].items.splice(selectedItemIdx, 1);
      setMenu(m);
      clearSelection();
    }
  }

  function clearSelection() {
    setSelectedType(null);
    setSelectedCatIdx(null);
    setSelectedSubIdx(null);
    setSelectedItemIdx(null);
    setEdit({});
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const finalMenu = applyEdit();
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalMenu),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      setMenu(finalMenu);
      setMessage(t('menuEditor.saved'));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={styles.loading}>{t('menuEditor.loading')}</div>;
  if (error && !menu) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.page}>
      <style>{`
        .me-sidebar-item { cursor: pointer; padding: 0.5rem 0.75rem; border-radius: 6px; transition: background 0.15s; }
        .me-sidebar-item:hover { background: rgba(16,185,129,0.08); }
        .me-sidebar-item.active { background: #D1FAE5; font-weight: 700; }
        .me-field-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1E3A5F; margin-bottom: 0.25rem; display: block; }
        .me-input { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #D8D3CB; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box; outline: none; transition: border-color 0.15s; }
        .me-input:focus { border-color: #1E3A5F; box-shadow: 0 0 0 3px rgba(30,58,95,0.08); }
        .me-btn { padding: 0.55rem 1rem; border: 1px solid rgba(30,58,95,0.2); border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.15s; min-height: 40px; }
        .me-btn:hover { background: rgba(30,58,95,0.06); }
        .me-btn-green { background: #10B981; color: #fff; border-color: #10B981; }
        .me-btn-green:hover { background: #059669; }
        .me-btn-red { background: #FEF2F2; color: #991B1B; border-color: #EF4444; }
        .me-btn-red:hover { background: #FEE2E2; }
        .me-btn-add { background: #FAF9F7; color: #1E3A5F; }
        .me-sidebar-scroll { max-height: calc(100vh - 160px); overflow-y: auto; }
        @media (max-width: 768px) {
          .me-layout { flex-direction: column !important; }
        }
      `}</style>

      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <Link to="/admin" style={styles.backLink}>← {t('menuEditor.backToOrders')}</Link>
          <h1 style={styles.title}>{t('menuEditor.title')}</h1>
        </div>
        <div style={styles.topRight}>
          {message && <span style={styles.successMsg}>{message}</span>}
          {error && <span style={styles.errorMsg}>{error}</span>}
          <button className="me-btn me-btn-green" onClick={handleSave} disabled={saving}>
            {saving ? t('menuEditor.saving') : t('menuEditor.save')}
          </button>
        </div>
      </div>

      <div className="me-layout" style={styles.layout}>
        {/* LEFT: tree navigator */}
        <div style={styles.sidebar}>
          <div className="me-sidebar-scroll">
            <button className="me-btn me-btn-add" style={{ width: '100%', marginBottom: '0.75rem' }} onClick={addCategory}>
              + {t('menuEditor.addCategory')}
            </button>

            {(menu?.categories || []).map((cat, ci) => (
              <div key={cat.id}>
                <div
                  className={`me-sidebar-item ${selectedType === 'category' && selectedCatIdx === ci ? 'active' : ''}`}
                  onClick={() => selectCategory(ci)}
                >
                  📁 {cat.name.en}
                </div>

                {selectedType === 'category' && selectedCatIdx === ci && (
                  <div style={{ paddingLeft: '1rem' }}>
                    <button className="me-btn me-btn-add" style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.78rem' }} onClick={addSubcategory}>
                      + {t('menuEditor.addSubcategory')}
                    </button>

                    {(cat.subcategories || []).map((sub, si) => (
                      <div key={sub.id}>
                        <div
                          className={`me-sidebar-item ${selectedType === 'subcategory' && selectedSubIdx === si ? 'active' : ''}`}
                          onClick={() => selectSubcategory(ci, si)}
                          style={{ paddingLeft: '1rem' }}
                        >
                          📂 {sub.name.en}
                        </div>

                        {selectedType === 'subcategory' && selectedSubIdx === si && (
                          <div style={{ paddingLeft: '2rem' }}>
                            <button className="me-btn me-btn-add" style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.78rem' }} onClick={addItem}>
                              + {t('menuEditor.addItem')}
                            </button>

                            {(sub.items || []).map((item, ii) => (
                              <div
                                key={item.id}
                                className={`me-sidebar-item ${selectedType === 'item' && selectedItemIdx === ii ? 'active' : ''}`}
                                onClick={() => selectItem(ci, si, ii)}
                                style={{ paddingLeft: '1rem' }}
                              >
                                🍽  {item.name.en}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: edit form */}
        <div style={styles.editor}>
          {!selectedType ? (
            <div style={styles.emptyState}>{t('menuEditor.selectPrompt')}</div>
          ) : (
            <div style={styles.formCard}>
              <div style={styles.formHeader}>
                <h2 style={styles.formTitle}>
                  {selectedType === 'category' && t('menuEditor.editCategory')}
                  {selectedType === 'subcategory' && t('menuEditor.editSubcategory')}
                  {selectedType === 'item' && t('menuEditor.editItem')}
                </h2>
                <button className="me-btn me-btn-red" onClick={deleteSelected}>
                  {t('menuEditor.delete')}
                </button>
              </div>

              {/* ID field */}
              <div style={styles.fieldGroup}>
                <label className="me-field-label">{t('menuEditor.fieldId')}</label>
                <input
                  className="me-input"
                  value={edit.id || ''}
                  onChange={e => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                    saveField('id', val);
                  }}
                />
              </div>

              {/* Name EN */}
              <div style={styles.fieldGroup}>
                <label className="me-field-label">{t('menuEditor.fieldNameEN')}</label>
                <input
                  className="me-input"
                  value={edit.name?.en || ''}
                  onChange={e => saveField('name.en', e.target.value)}
                  placeholder="e.g. Main Course"
                />
              </div>

              {/* Name ES */}
              <div style={styles.fieldGroup}>
                <label className="me-field-label">{t('menuEditor.fieldNameES')}</label>
                <input
                  className="me-input"
                  value={edit.name?.es || ''}
                  onChange={e => saveField('name.es', e.target.value)}
                  placeholder="e.g. Plato Principal"
                />
              </div>

              {/* Item-only fields */}
              {selectedType === 'item' && (
                <>
                  <div style={styles.fieldGroup}>
                    <label className="me-field-label">{t('menuEditor.fieldDescEN')}</label>
                    <textarea
                      className="me-input"
                      rows={2}
                      value={edit.description?.en || ''}
                      onChange={e => saveField('description.en', e.target.value)}
                      placeholder="English description"
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label className="me-field-label">{t('menuEditor.fieldDescES')}</label>
                    <textarea
                      className="me-input"
                      rows={2}
                      value={edit.description?.es || ''}
                      onChange={e => saveField('description.es', e.target.value)}
                      placeholder="Descripción en español"
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label className="me-field-label">{t('menuEditor.fieldPrice')} (USD)</label>
                    <input
                      className="me-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={edit.price ?? ''}
                      onChange={e => saveField('price', parseFloat(e.target.value) || 0)}
                      style={{ maxWidth: '160px' }}
                    />
                  </div>
                </>
              )}

              {/* Preview */}
              {selectedType === 'item' && edit.price > 0 && (
                <div style={styles.pricePreview}>
                  {t('menuEditor.preview')}: <strong>${edit.price} USD</strong>
                  {edit.name?.en && ` — ${edit.name.en}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#FAF9F7', minHeight: '100vh', padding: 'clamp(1rem, 3vw, 1.5rem)' },
  loading: { textAlign: 'center', padding: '4rem', color: '#1E3A5F' },
  error: { textAlign: 'center', padding: '4rem', color: '#991B1B' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', maxWidth: '1400px', margin: '0 auto 1.5rem' },
  topLeft: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  topRight: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  backLink: { fontSize: '0.85rem', color: '#10B981', textDecoration: 'none', fontWeight: '600' },
  title: { margin: 0, color: '#1E3A5F', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: '800' },
  successMsg: { color: '#059669', fontWeight: '600', fontSize: '0.9rem' },
  errorMsg: { color: '#991B1B', fontWeight: '600', fontSize: '0.9rem' },
  layout: { display: 'flex', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' },
  sidebar: { width: '280px', flexShrink: 0, background: '#fff', borderRadius: '12px', border: '1px solid #E8E3DB', padding: '1rem', alignSelf: 'flex-start', position: 'sticky', top: '1rem' },
  editor: { flex: 1, minWidth: 0 },
  emptyState: { background: '#fff', borderRadius: '12px', border: '1px solid #E8E3DB', padding: '3rem', textAlign: 'center', color: 'rgba(30,58,95,0.5)', fontSize: '1rem' },
  formCard: { background: '#fff', borderRadius: '12px', border: '1px solid #E8E3DB', padding: '1.5rem' },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  formTitle: { margin: 0, color: '#1E3A5F', fontSize: '1.1rem' },
  fieldGroup: { marginBottom: '1rem' },
  pricePreview: { marginTop: '1rem', padding: '0.75rem', background: '#D1FAE5', borderRadius: '8px', color: '#059669', fontSize: '0.9rem' },
};
