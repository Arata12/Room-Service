import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../CartContext';
import { useNavigate } from 'react-router-dom';

export default function GuestForm() {
  const { t } = useTranslation();
  const { cart, getTotal, clearCart, currency } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roomNumber: '',
    guestName: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const testMode = import.meta.env.VITE_TEST_MODE === 'true';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = t('checkout.errors.roomRequired');
    }
    if (!formData.guestName.trim()) {
      newErrors.guestName = t('checkout.errors.nameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          roomNumber: formData.roomNumber,
          guestName: formData.guestName,
          notes: formData.notes,
          currency,
        }),
      });

      const data = await response.json();
      if (testMode && data.order) {
        clearCart();
        navigate('/success', { state: { demoMode: true, order: data.order } });
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(testMode ? 'Demo checkout failed' : t('errors.paymentFailed'));
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName) => ({
    ...styles.input,
    borderColor: errors[fieldName]
      ? '#C62828'
      : focusedField === fieldName
        ? '#1E3A5F'
        : '#D8D3CB',
    boxShadow: focusedField === fieldName && !errors[fieldName]
      ? '0 0 0 3px rgba(30,58,95,0.1)'
      : 'none',
  });

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Accent header bar */}
      <div style={styles.formHeader}>
        <h2 style={styles.title}>{t('checkout.title')}</h2>
      </div>

      <div style={styles.formBody}>
        <div style={styles.field}>
          <label style={styles.label}>{t('checkout.roomNumber')}</label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            onFocus={() => setFocusedField('roomNumber')}
            onBlur={() => setFocusedField(null)}
            placeholder={t('checkout.roomNumberPlaceholder')}
            style={getInputStyle('roomNumber')}
          />
          {errors.roomNumber && <span style={styles.error}>{errors.roomNumber}</span>}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('checkout.guestName')}</label>
          <input
            type="text"
            name="guestName"
            value={formData.guestName}
            onChange={handleChange}
            onFocus={() => setFocusedField('guestName')}
            onBlur={() => setFocusedField(null)}
            placeholder={t('checkout.guestNamePlaceholder')}
            style={getInputStyle('guestName')}
          />
          {errors.guestName && <span style={styles.error}>{errors.guestName}</span>}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('checkout.notes')}</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            onFocus={() => setFocusedField('notes')}
            onBlur={() => setFocusedField(null)}
            placeholder={t('checkout.notesPlaceholder')}
            style={{
              ...styles.textarea,
              borderColor: focusedField === 'notes' ? '#1E3A5F' : '#D8D3CB',
              boxShadow: focusedField === 'notes' ? '0 0 0 3px rgba(30,58,95,0.1)' : 'none',
            }}
            rows={3}
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.submitButton,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          disabled={loading}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#059669'; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#10B981'; }}
        >
          {loading
            ? t('checkout.processing')
            : testMode
              ? 'Place Demo Order'
              : t('checkout.payNow')}
        </button>
      </div>
    </form>
  );
}

const styles = {
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    border: '1px solid #E8E3DB',
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
  },
  formHeader: {
    backgroundColor: '#F5F0E8',
    padding: 'clamp(1rem, 3vw, 1.25rem) clamp(1rem, 4vw, 2rem)',
    borderBottom: '1px solid rgba(30,58,95,0.08)',
  },
  formBody: {
    padding: 'clamp(1.25rem, 4vw, 1.75rem) clamp(1rem, 4vw, 2rem)',
  },
  title: {
    marginTop: 0,
    marginBottom: 0,
    color: '#1E3A5F',
    fontSize: 'clamp(1.05rem, 3vw, 1.25rem)',
    fontWeight: '700',
  },
  field: {
    marginBottom: '1.1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.45rem',
    color: 'rgba(30,58,95,0.8)',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #D8D3CB',
    borderRadius: '5px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    color: '#2C3E50',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    minHeight: '44px',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #D8D3CB',
    borderRadius: '5px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    resize: 'vertical',
    color: '#2C3E50',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  error: {
    color: '#C62828',
    fontSize: '0.82rem',
    marginTop: '0.3rem',
    display: 'block',
    fontWeight: '500',
  },
  submitButton: {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1.05rem',
    fontWeight: '700',
    marginTop: '0.75rem',
    transition: 'background-color 0.2s, opacity 0.2s',
    boxShadow: '0 3px 10px rgba(16,185,129,0.25)',
    minHeight: '48px',
  },
};
