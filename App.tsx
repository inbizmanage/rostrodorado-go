import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import { LazyMotion, domAnimation } from 'framer-motion';

import { CartProvider } from './context/CartContext';
import CartDrawer from './components/Cart/CartDrawer';
import ContactDrawer from './components/ContactDrawer';

import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import ToastContainer from './components/ToastContainer';
import CookieBanner from './components/CookieBanner';

// Lazy Loaded Components
const ProductsPage = React.lazy(() => import('./components/ProductsPage'));
const ProductDetailsPage = React.lazy(() => import('./components/ProductDetailsPage'));
const CheckoutPage = React.lazy(() => import('./components/Checkout/CheckoutPage'));
const LoginPage = React.lazy(() => import('./components/Auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./components/Auth/RegisterPage'));
const AdminDashboard = React.lazy(() => import('./components/Admin/AdminDashboard'));
const OrdersPage = React.lazy(() => import('./components/Profile/OrdersPage'));
const LoginVerifyPage = React.lazy(() => import('./components/Auth/LoginVerifyPage'));
const TerminosCondiciones = React.lazy(() => import('./components/Legal/TerminosCondiciones'));
const PoliticaPrivacidad = React.lazy(() => import('./components/Legal/PoliticaPrivacidad'));
const PoliticaEnvios = React.lazy(() => import('./components/Legal/PoliticaEnvios'));
const PoliticaReembolso = React.lazy(() => import('./components/Legal/PoliticaReembolso'));
const BlogPage = React.lazy(() => import('./components/Blog/BlogPage'));
const BlogPost = React.lazy(() => import('./components/Blog/BlogPost'));
const KioskForm = React.lazy(() => import('./components/Forms/KioskForm'));

import { useAnalytics } from './hooks/useAnalytics';

const AnalyticsTracker = () => {
  useAnalytics();
  return null;
};

const App: React.FC = () => {
  const basename = window.location.hostname.includes('github.io') ? '/rostrodorado-go' : '/';
  return (
    <AuthProvider>
      <CartProvider>
        <LazyMotion features={domAnimation}>
          <Router basename={basename}>
            <AnalyticsTracker />
            <ToastContainer />
            <CookieBanner />
            <CartDrawer />
            <ContactDrawer />
            <Suspense fallback={<div className="flex justify-center items-center h-screen w-full bg-[#1A1A1A] text-[#C6A87C]">Cargando...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/productos" element={<ProductsPage />} />
                <Route path="/productos/:slug/:id" element={<ProductDetailsPage />} />
                <Route path="/productos/:id" element={<ProductDetailsPage />} />

                <Route path="/mis-pedidos" element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                } />

                {/* Changed: Checkout is now publicly accessible for Guest Checkout */}
                <Route path="/checkout" element={<CheckoutPage />} />

                <Route path="/admin/*" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                
                {/* Kiosk Form Route */}
                <Route path="/kiosko/:formId" element={<KioskForm />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/verify-login" element={<LoginVerifyPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Blog Pages */}
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPost />} />

                {/* Legal Pages */}
                <Route path="/terminos-y-condiciones" element={<TerminosCondiciones />} />
                <Route path="/politica-de-privacidad" element={<PoliticaPrivacidad />} />
                <Route path="/politica-de-envios" element={<PoliticaEnvios />} />
                <Route path="/politica-devoluciones" element={<PoliticaReembolso />} />


                {/* Redirect old /products to /productos */}
                <Route path="/products" element={<Navigate to="/productos" replace />} />

                {/* Catch all - Redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </LazyMotion>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;