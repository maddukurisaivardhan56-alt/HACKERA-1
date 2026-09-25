import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  MapPin,
  BadgeCheck,
  Building,
  Phone,
  Mail,
} from 'lucide-react';

export const OfficerProfileHeader: React.FC = () => {
  const { officer } = useApp();

  return (
    <div className="bg-gradient-to-r from-[#064E3B] via-[#08634B] to-[#064E3B] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
      {/* Decorative background watermarks */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-300/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Officer Main Info */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-800/80 border-2 border-[#F8E7C9]/40 shadow-inner flex items-center justify-center text-[#F8E7C9] font-bold text-2xl sm:text-3xl shrink-0">
              {officer.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div
              className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#064E3B] shadow"
              title="Verified Agriculture Officer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <BadgeCheck className="w-3 h-3" />
                Officer ID: {officer.id}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/15 text-amber-200 border border-amber-400/30">
                Govt. of Maharashtra
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {officer.name}
            </h1>

            <p className="text-sm font-medium text-emerald-100/90 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-300" />
              <span>{officer.designation}</span>
              <span className="text-emerald-400/60">•</span>
              <span className="text-emerald-200 text-xs hidden sm:inline">{officer.officeLocation}</span>
            </p>
          </div>
        </div>

        {/* Assigned Area Details */}
        <div className="flex flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t border-emerald-700/50 lg:border-t-0">
          <div className="bg-emerald-900/50 backdrop-blur-sm border border-emerald-600/30 rounded-xl px-4 py-2.5 text-xs space-y-1 max-w-md">
            <div className="flex items-center gap-1.5 text-emerald-200 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assigned Jurisdiction:</span>
              <span className="text-white font-bold">
                Taluka {officer.assignedTaluka}, Dist. {officer.assignedDistrict}
              </span>
            </div>
            <div className="text-emerald-100/80 text-[11px] leading-relaxed">
              <span className="font-medium text-emerald-300">Assigned Villages: </span>
              {officer.assignedVillages.join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Strip */}
      <div className="mt-4 pt-3 border-t border-emerald-700/40 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-200/90">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{officer.phone}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>{officer.email}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
