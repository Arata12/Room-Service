import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import SuccessPage from './pages/SuccessPage';
import AdminPage from './pages/AdminPage';

function AdminLogin() {
  const [secret, setSecret] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (secret) {
      localStorage.setItem('adminToken', secret);
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '420px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="ADMIN_SECRET" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function AdminRoute() {
  const token = localStorage.getItem('adminToken');
  if (!token) return <AdminLogin />;
  return <AdminPage />;
}

function App() {
  return (
    <CartProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#FAF9F7', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/admin" element={<AdminRoute />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;
