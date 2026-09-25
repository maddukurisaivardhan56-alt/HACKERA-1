import React from 'react';
import { useApp } from '../../context/AppContext';

interface DemoTagProps {
  label?: string;
  size?: 'sm' | 'md';
}

export const DemoTag: React.FC<DemoTagProps> = ({ label, size = 'sm' }) => {
  const { t } = useApp();
  const displayLabel = label || t('prototypeBadge', 'INDICATIVE DATA');

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 ${
        size === 'md' ? 'text-xs px-2 py-1' : ''
      }`}
      title="Prototype Decision Intelligence Feed"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1 animate-pulse"></span>
      {displayLabel}
    </span>
  );
};
