import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../components/layout/PublicLayout';
import { FarmerLayout } from '../components/layout/FarmerLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { StorageOwnerLayout } from '../components/layout/StorageOwnerLayout';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { DemoAccessPage } from '../pages/public/DemoAccessPage';

// Developer Pages (Completely private)
import { DeveloperLoginPage } from '../pages/developer/DeveloperLoginPage';
import { DeveloperDashboardPage } from '../pages/developer/DeveloperDashboardPage';

// Farmer Pages
import { FarmerDashboard } from '../pages/farmer/FarmerDashboard';
import { MandiComparisonPage } from '../pages/farmer/MandiComparisonPage';
import { SellOrStorePage } from '../pages/farmer/SellOrStorePage';
import { ColdStoragePage } from '../pages/farmer/ColdStoragePage';
import { AdvisoryHistoryPage } from '../pages/farmer/AdvisoryHistoryPage';

// Agriculture Officer Pages
import { AdminCallingDashboardPage } from '../pages/admin/AdminCallingDashboardPage';
import { BulkCallingPage } from '../pages/admin/BulkCallingPage';
import { FarmerSupportPage } from '../pages/admin/FarmerSupportPage';
import { MarketPriceInfoPage } from '../pages/admin/MarketPriceInfoPage';
import { GovernmentSchemesPage } from '../pages/admin/GovernmentSchemesPage';
import { FieldInspectionPage } from '../pages/admin/FieldInspectionPage';

// Cold Storage Owner Pages
import { StorageOwnerDashboardPage } from '../pages/owner/StorageOwnerDashboardPage';

// Auth Service
import { AuthService } from '../services/authService';

export const AppRoutes: React.FC = () => {
  useEffect(() => {
    const isDevPath = window.location.pathname.startsWith('/developer');
    if (isDevPath) {
      const devSession = AuthService.getDeveloperSession();
      if (!devSession.isAuthenticated && window.location.pathname !== '/developer') {
        window.history.replaceState(null, '', '/developer');
      }
      return;
    }

    // Public / Protected portal routing check
    const session = AuthService.getCurrentSession();
    const publicPaths = ['/', '/login', '/demo'];
    if (!session.isAuthenticated && !publicPaths.includes(window.location.pathname)) {
      window.history.replaceState(null, '', '/login');
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public / Authentication Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/demo" element={<DemoAccessPage />} />
        </Route>

        {/* Dedicated Private Developer Routes */}
        <Route path="/developer" element={<DeveloperLoginPage />} />
        <Route path="/developer/dashboard" element={<DeveloperDashboardPage />} />

        {/* Farmer Portal Routes */}
        <Route path="/farmer" element={<FarmerLayout />}>
          <Route index element={<FarmerDashboard />} />
          <Route path="mandis" element={<MandiComparisonPage />} />
          <Route path="sell-or-store" element={<SellOrStorePage />} />
          <Route path="cold-storage" element={<ColdStoragePage />} />
          <Route path="advisories" element={<AdvisoryHistoryPage />} />
        </Route>

        {/* Agriculture Officer Portal Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminCallingDashboardPage />} />
          <Route path="calling-dashboard" element={<AdminCallingDashboardPage />} />
          <Route path="bulk-calling" element={<BulkCallingPage />} />
          <Route path="farmer-support" element={<FarmerSupportPage />} />
          <Route path="market-info" element={<MarketPriceInfoPage />} />
          <Route path="government-schemes" element={<GovernmentSchemesPage />} />
          <Route path="field-inspections" element={<FieldInspectionPage />} />
        </Route>

        {/* Cold Storage Owner Portal Routes */}
        <Route path="/storage-owner" element={<StorageOwnerLayout />}>
          <Route index element={<StorageOwnerDashboardPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
