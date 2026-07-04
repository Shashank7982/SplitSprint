import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { store } from './store';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ToastContainer from './components/ui/ToastContainer';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BrowsePoolsPage from './pages/BrowsePoolsPage';
import CreatePoolPage from './pages/CreatePoolPage';
import PoolDetailPage from './pages/PoolDetailPage';
import ProfilePage from './pages/ProfilePage';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const stripeOptions = {
  appearance: {
    theme: 'night',
    variables: {
      colorPrimary: '#F7931A',
      colorBackground: '#030304',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: '"JetBrains Mono", monospace',
      borderRadius: '0px',
    },
  },
};

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col bg-[#030304]">
      <Navbar />
      <div className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/"          element={<LandingPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/pools"     element={<ProtectedRoute><BrowsePoolsPage /></ProtectedRoute>} />
          <Route path="/pools/create" element={<ProtectedRoute><CreatePoolPage /></ProtectedRoute>} />
          <Route path="/pools/:id" element={<ProtectedRoute><PoolDetailPage /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Elements stripe={stripePromise} options={stripeOptions}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </Elements>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
