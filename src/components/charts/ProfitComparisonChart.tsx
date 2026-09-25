import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { SellOrStoreResult } from '../../types';
import { formatINR } from '../../utils/formatters';

interface ProfitComparisonChartProps {
  result: SellOrStoreResult;
}

export const ProfitComparisonChart: React.FC<ProfitComparisonChartProps> = ({ result }) => {
  const chartData = [
    {
      name: 'Sell Now (Immediate)',
      netValue: result.sellNowNetValue,
      grossValue: result.sellNowGrossValue,
      costs: result.sellNowTransportCost,
      color: '#475569',
    },
    {
      name: 'Store & Sell Later',
      netValue: result.storeAndSellNetValue,
      grossValue: result.futureGrossSellingValue,
      costs: result.totalStorageRelatedCosts,
      color: result.netAdditionalGainINR >= 0 ? '#064E3B' : '#dc2626',
    },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-[#FFFDF7] p-3 rounded-lg shadow-md border border-[#E0C79B] text-xs">
                    <p className="font-semibold text-[#064E3B] mb-1.5">{item.name}</p>
                    <div className="space-y-1">
                      <p className="text-slate-500 flex justify-between gap-4">
                        <span>Gross Realization:</span>
                        <span className="font-medium text-slate-700">{formatINR(item.grossValue)}</span>
                      </p>
                      <p className="text-slate-500 flex justify-between gap-4">
                        <span>Deductions & Storage:</span>
                        <span className="font-medium text-rose-600">-{formatINR(item.costs)}</span>
                      </p>
                      <div className="pt-1 border-t border-[#E0C79B]/40 flex justify-between gap-4 font-bold">
                        <span className="text-[#064E3B]">Net Farmer Cash:</span>
                        <span className="text-[#064E3B]">{formatINR(item.netValue)}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="netValue" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
