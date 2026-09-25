import React, { ReactNode } from 'react';
import { DemoTag } from './DemoTag';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositiveGood?: boolean;
  };
  highlight?: boolean;
  showDemoTag?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
  showDemoTag = false,
  action,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#FFFDF7] rounded-xl border p-5 shadow-2xs transition-shadow hover:shadow-xs ${
        highlight
          ? 'border-[#064E3B] ring-1 ring-[#064E3B]/20 bg-[#F8E7C9]/40'
          : 'border-[#E0C79B]/80'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#064E3B]/70">
            {title}
          </span>
          {showDemoTag && <DemoTag />}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-[#F8E7C9]/60 text-[#064E3B]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-1">
        <div className="text-2xl font-bold tracking-tight text-[#064E3B]">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-[#064E3B]/70 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {(trend || action) && (
        <div className="mt-4 pt-3 border-t border-[#E0C79B]/40 flex items-center justify-between text-xs">
          {trend && (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  trend.value >= 0
                    ? trend.isPositiveGood !== false
                      ? 'bg-[#F8E7C9] text-[#064E3B] border border-[#E0C79B]'
                      : 'bg-rose-50 text-rose-700'
                    : trend.isPositiveGood !== false
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-[#F8E7C9] text-[#064E3B] border border-[#E0C79B]'
                }`}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-[#064E3B]/60 font-medium">{trend.label || 'vs last week'}</span>
            </div>
          )}

          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="text-[#064E3B] font-bold hover:underline ml-auto"
            >
              {action.label} →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
