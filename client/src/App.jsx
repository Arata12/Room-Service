import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import SuccessPage from './pages/SuccessPage';
import AdminPage from './pages/AdminPage';

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
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;
