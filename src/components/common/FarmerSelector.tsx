import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck } from 'lucide-react';

export const FarmerSelector: React.FC = () => {
  const { activeFarmer, t } = useApp();

  return (
    <div className="inline-flex items-center gap-2 bg-[#043D2E] px-3.5 py-1.5 rounded-xl border border-[#E0C79B]/40 text-xs shadow-xs text-[#F8E7C9]">
      <div className="flex items-center gap-1.5 text-[#F8E7C9]/75 font-medium">
        <UserCheck className="w-3.5 h-3.5 text-[#F8E7C9]" />
        <span>{t('activeProfile', 'Active Profile')}:</span>
      </div>
      <span className="font-bold text-[#F8E7C9] tracking-wide">
        {activeFarmer.name || t('loading', 'Loading...')}
      </span>
    </div>
  );
};

