import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { SellOrStoreResult } from '../../types';
import { formatINR } from '../../utils/formatters';

interface StorageCostBreakdownChartProps {
  result: SellOrStoreResult;
}

export const StorageCostBreakdownChart: React.FC<StorageCostBreakdownChartProps> = ({
  result,
}) => {
  const data = [
    {
      name: 'Warehouse Storage Rent',
      value: result.totalDirectStorageCost,
      color: '#064E3B',
    },
    {
      name: 'Transport Freight to Facility',
      value: result.totalTransportCostToStorage,
      color: '#2d6a4f',
    },
    {
      name: 'Handling & Loading / CIPC',
      value: result.totalHandlingCost,
      color: '#52b788',
    },
    {
      name: 'Interest / Opportunity Cost',
      value: result.estimatedFinanceOpportunityCost,
      color: '#d97706',
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white p-2.5 rounded-lg shadow-md border border-slate-200 text-xs">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-slate-600 font-medium mt-0.5">
                      {formatINR(item.value)} (
                      {(
                        (item.value / result.totalStorageRelatedCosts) *
                        100
                      ).toFixed(1)}
                      %)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
