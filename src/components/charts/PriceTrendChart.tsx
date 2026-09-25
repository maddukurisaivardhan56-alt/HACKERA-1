import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { HistoricalPricePoint } from '../../types';
import { formatINR } from '../../utils/formatters';

interface PriceTrendChartProps {
  commodity: string;
  data: HistoricalPricePoint[];
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  commodity,
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No price history recorded for {commodity}
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#064E3B" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#064E3B" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#52b788" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#52b788" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            domain={['dataMin - 200', 'dataMax + 200']}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-[#FFFDF7] p-3 rounded-lg shadow-md border border-[#E0C79B] text-xs">
                    <p className="font-semibold text-[#064E3B] mb-1">{label} (Indicative)</p>
                    <div className="space-y-0.5">
                      <p className="text-[#064E3B] font-semibold">
                        Modal Price: {formatINR(payload[0]?.value as number)}/Qtl
                      </p>
                      {payload[1] && (
                        <p className="text-slate-500">
                          Max Price: {formatINR(payload[1]?.value as number)}/Qtl
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
          />
          <Area
            type="monotone"
            dataKey="modalPrice"
            name="Modal Price (₹/Qtl)"
            stroke="#064E3B"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorModal)"
          />
          <Area
            type="monotone"
            dataKey="maxPrice"
            name="Max Price (₹/Qtl)"
            stroke="#52b788"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorMax)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
