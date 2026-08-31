import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from '@/components/ui/toaster';

import MainLayout from '@/layouts/MainLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public Pages
import Landing from '@/pages/Landing';
import Marketplace from '@/pages/Marketplace';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotificationsPage from '@/pages/Notifications';

// Farmer Pages
import FarmerDashboard from '@/pages/farmer/Dashboard';
import FarmerListings from '@/pages/farmer/Listings';
import AddListing from '@/pages/farmer/AddListing';
import FarmerOrders from '@/pages/farmer/Orders';

// Consumer Pages
import ConsumerDashboard from '@/pages/consumer/Dashboard';
import ConsumerOrders from '@/pages/consumer/Orders';
import SavedProducts from '@/pages/consumer/SavedProducts';

// Bulk Buyer Pages
import BulkBuyerDashboard from '@/pages/buyer/Dashboard';
import BulkProcurement from '@/pages/buyer/Procurement';

// FPO Pages
import FPODashboard from '@/pages/fpo/Dashboard';

// Logistics Pages
import LogisticsDashboard from '@/pages/logistics/Dashboard';
import RouteOptimizer from '@/pages/logistics/RouteOptimizer';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import AdminListings from '@/pages/admin/AdminListings';
import AdminOrders from '@/pages/admin/AdminOrders';
import PlatformImpact from '@/pages/admin/Impact';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Public Routes with MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Farmer Dashboard Routes */}
              <Route
                path="/farmer"
                element={
                  <ProtectedRoute allowedRoles={['FARMER', 'ADMIN', 'FPO']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<FarmerDashboard />} />
                <Route path="listings" element={<FarmerListings />} />
                <Route path="add-listing" element={<AddListing />} />
                <Route path="orders" element={<FarmerOrders />} />
              </Route>

              {/* Consumer Dashboard Routes */}
              <Route
                path="/consumer"
                element={
                  <ProtectedRoute allowedRoles={['CONSUMER', 'ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ConsumerDashboard />} />
                <Route path="orders" element={<ConsumerOrders />} />
                <Route path="saved" element={<SavedProducts />} />
              </Route>

              {/* Bulk Buyer Dashboard Routes */}
              <Route
                path="/buyer"
                element={
                  <ProtectedRoute allowedRoles={['BULK_BUYER', 'ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<BulkBuyerDashboard />} />
                <Route path="procurement" element={<BulkProcurement />} />
                <Route path="orders" element={<ConsumerOrders />} />
              </Route>

              {/* FPO Dashboard Routes */}
              <Route
                path="/fpo"
                element={
                  <ProtectedRoute allowedRoles={['FPO', 'ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<FPODashboard />} />
              </Route>

              {/* Logistics Dashboard Routes */}
              <Route
                path="/logistics"
                element={
                  <ProtectedRoute allowedRoles={['LOGISTICS', 'ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<LogisticsDashboard />} />
                <Route path="route" element={<RouteOptimizer />} />
              </Route>

              {/* Admin Dashboard Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="listings" element={<AdminListings />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="impact" element={<PlatformImpact />} />
              </Route>

              {/* Generic Authenticated Notifications */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<NotificationsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
