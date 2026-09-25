import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useApp } from '../../context/AppContext';
import { DemoModeBanner } from '../common/DemoModeBanner';

export const AdminLayout: React.FC = () => {
  const { session } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!session.isAuthenticated || session.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-background, #FAFAFA)' }}
    >
      <Header
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        isMobileSidebarOpen={mobileSidebarOpen}
      />
      <DemoModeBanner />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar role="admin" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div
              className="relative flex-1 flex flex-col max-w-[280px] w-full z-10 shadow-xl h-full border-r"
              style={{
                backgroundColor: 'var(--color-surface, #FFFFFF)',
                borderColor: 'var(--color-border, #E0E0E0)',
              }}
            >
              <Sidebar
                role="admin"
                onCloseMobile={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
