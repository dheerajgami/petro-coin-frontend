import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { logout } from './store/slices/authSlice';

import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';

// Layouts
import SuperAdminLayout from './layouts/SuperAdminLayout';
import MerchantLayout from './layouts/MerchantLayout';

// Pages
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import MerchantManagement from './pages/SuperAdmin/MerchantManagement';
import CustomerManagement from './pages/SuperAdmin/CustomerManagement';
import FuelStationManagement from './pages/SuperAdmin/FuelStationManagement';
import ComplianceManagement from './pages/SuperAdmin/ComplianceManagement';
import TokenManagement from './pages/SuperAdmin/TokenManagement';
import TransactionsManagement from './pages/SuperAdmin/TransactionsManagement';
import TransporterManagement from './pages/SuperAdmin/TransporterManagement';
import ReportsAnalytics from './pages/SuperAdmin/ReportsAnalytics';
import SystemSettings from './pages/SuperAdmin/SystemSettings';
import FuelAdminDashboard from './pages/FuelAdmin/Dashboard';
import MerchantDashboard from './pages/Merchant/Dashboard';
import OutletList from './pages/Merchant/OutletList';
import OutletAnalytics from './pages/Merchant/OutletAnalytics';
import InventoryManagement from './pages/Merchant/InventoryManagement';
import TransportDashboard from './pages/Transport/Dashboard';

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // If token exists but user data is lost (e.g. old session), clear it to prevent redirect loop
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(logout());
    }
  }, [isAuthenticated, user, dispatch]);

  // Helper to redirect to correct dashboard based on role
  const getDashboardRoute = () => {
    if (!user) return '/login';
    // Backend API aapko 'admin' return kar raha hai Super Admin ke liye
    switch (user.role) {
      case 'admin': 
      case 'super_admin': return '/super-admin';
      case 'fuel_admin': return '/fuel-admin';
      case 'merchant': return '/merchant';
      case 'transport': return '/transport';
      default: return '/login';
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route 
          path="/login" 
          element={(!isAuthenticated || !user) ? <Login /> : <Navigate to={getDashboardRoute()} />} 
        />
        
        {/* Super Admin Routes */}
        <Route 
          path="/super-admin" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="merchants" element={<MerchantManagement />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="fuel-stations" element={<FuelStationManagement />} />
          <Route path="compliance" element={<ComplianceManagement />} />
          <Route path="tokens" element={<TokenManagement />} />
          <Route path="transactions" element={<TransactionsManagement />} />
          <Route path="transporters" element={<TransporterManagement />} />
          <Route path="reports" element={<ReportsAnalytics />} />
          <Route path="settings" element={<SystemSettings />} />
          {/* Add more nested routes for super-admin here later */}
        </Route>

        {/* Fuel Admin Routes */}
        <Route 
          path="/fuel-admin/*" 
          element={
            <ProtectedRoute allowedRoles={['fuel_admin']}>
              <FuelAdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Merchant Routes */}
        <Route 
          path="/merchant" 
          element={
            <ProtectedRoute allowedRoles={['merchant']}>
              <MerchantLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<MerchantDashboard />} />
          <Route path="outlets" element={<OutletList />} />
          <Route path="outlets/:id" element={<OutletAnalytics />} />
          <Route path="inventory" element={<InventoryManagement />} />
          {/* Add more nested routes for merchant here later */}
        </Route>

        {/* Transport Routes */}
        <Route 
          path="/transport/*" 
          element={
            <ProtectedRoute allowedRoles={['transport']}>
              <TransportDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Catch-all Route */}
        <Route path="*" element={(!isAuthenticated || !user) ? <Navigate to="/login" /> : <Navigate to={getDashboardRoute()} />} />
      </Routes>
    </Router>
  )
}

export default App
