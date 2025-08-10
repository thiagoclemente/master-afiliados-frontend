'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CliquePorRegiao } from '@/services/commissions.service';
import { TooltipProps } from './types';

interface ClicksByRegionChartProps {
  data: CliquePorRegiao[];
}

export default function ClicksByRegionChart({ data }: ClicksByRegionChartProps) {
  const chartData = data.map((item) => ({
    name: item.regiao.length > 12 ? `${item.regiao.substring(0, 12)}...` : item.regiao,
    cliques: item.cliques,
    fullName: item.regiao
  }));

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.fullName}</p>
          <p className="text-red-400">Cliques: {(data.cliques || 0).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-white mb-4 text-center">
        Cliques por Região
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9CA3AF"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="cliques" 
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
