import React from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Warehouse, LogOut, ShieldCheck, Building2, MapPin, Phone, Bell } from 'lucide-react';
import { AUTHORIZED_STORAGE_OWNERS } from '../../services/authService';
import { DemoModeBanner } from '../common/DemoModeBanner';

export const StorageOwnerLayout: React.FC = () => {
  const navigate = useNavigate();
  const { session, logout, storageFacilities, appointments } = useApp();

  if (!session.isAuthenticated || session.role !== 'storage_owner') {
    return <Navigate to="/login" replace />;
  }

  const facilityId = session.storageOwnerFacilityId || 'cs-001';
  const facility = storageFacilities.find((f) => f.id === facilityId) || storageFacilities[0];
  const ownerConfig = AUTHORIZED_STORAGE_OWNERS.find((o) => o.facilityId === facilityId);

  const pendingCount = appointments.filter(
    (a) => a.facilityId === facilityId && (a.status === 'Pending' || a.status === 'Reschedule Requested')
  ).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen flex flex-col text-slate-900"
      style={{ backgroundColor: 'var(--color-background, #FAFAFA)' }}
    >
      {/* Top Header */}
      <header
        className="sticky top-0 z-40 text-white shadow-md border-b"
        style={{
          backgroundColor: 'var(--color-primary, #388E3C)',
          borderColor: 'rgba(0,0,0,0.15)',
        }}
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          {/* Brand & Facility Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F8E7C9] text-[#064E3B] flex items-center justify-center font-bold shadow-xs shrink-0">
              <Warehouse className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#F8E7C9]/70 truncate">
                  Cold Storage Owner
                </span>
                <span className="hidden xs:inline px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-700/80 text-[#F8E7C9] border border-emerald-500/40 shrink-0">
                  WDRA
                </span>
                {session.isDemo && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs tracking-wider uppercase border border-amber-300 shadow-xs inline-flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    DEMO MODE
                  </span>
                )}
              </div>
              <h1 className="text-xs sm:text-base font-bold text-white tracking-tight truncate max-w-[140px] sm:max-w-md">
                {facility?.name || 'Sahyadri Agro Cold Storage'}
              </h1>
            </div>
          </div>

          {/* Right Header Navigation & Owner Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Counter */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-emerald-100">
              <Bell className="w-3.5 h-3.5 text-[#F8E7C9]" />
              <span>{pendingCount} Action Needed</span>
            </div>

            {/* Owner Details */}
            <div className="hidden md:flex flex-col text-right text-xs">
              <span className="font-bold text-white leading-tight">
                {session.storageOwnerName || ownerConfig?.ownerName || 'Facility Manager'}
              </span>
              <span className="text-[11px] text-[#F8E7C9]/80 truncate">
                {facility?.district || 'Nashik'} Dist. • {facility?.location || 'Mohadi'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8E7C9] text-[#064E3B] text-xs font-bold hover:bg-white transition-colors cursor-pointer shadow-xs min-h-[44px] touch-manipulation"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub-bar with facility metadata snapshot */}
        <div className="bg-[#043D2E] text-[11px] text-emerald-200/90 py-1.5 px-3 sm:px-8 border-t border-emerald-800/40 flex items-center justify-between overflow-x-auto whitespace-nowrap no-scrollbar">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#F8E7C9]" />
              {facility?.location}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#F8E7C9]" />
              Contact: {facility?.contactPhone}
            </span>
            <span>
              Capacity: <strong>{facility?.availableCapacityMT} MT Free</strong> / {facility?.totalCapacityMT} MT Total
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span>Logged in as: <strong>{session.storageOwnerEmail}</strong></span>
          </div>
        </div>
      </header>
      <DemoModeBanner />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Portal Footer */}
      <footer className="border-t border-[#E0C79B]/50 bg-[#FFFDF7] py-4 text-center text-xs text-[#064E3B]/70">
        Farmer&apos;s Gamble Cold Storage Network • Ministry of Agriculture & Farmer Welfare • Secured by Supabase RLS
      </footer>
    </div>
  );
};
