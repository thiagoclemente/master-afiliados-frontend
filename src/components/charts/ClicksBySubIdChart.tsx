'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CliquePorSubId } from '@/services/commissions.service';
import { TooltipProps } from './types';

interface ClicksBySubIdChartProps {
  data: CliquePorSubId[];
}

export default function ClicksBySubIdChart({ data }: ClicksBySubIdChartProps) {
  console.log('ClicksBySubIdChart data:', data);
  
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.sub_id.length > 15 ? `${item.sub_id.substring(0, 15)}...` : item.sub_id,
    cliques: item.cliques,
    percentual: item.percentual,
    fullName: item.sub_id
  }));
  
  console.log('ClicksBySubIdChart chartData:', chartData);

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.fullName}</p>
          <p className="text-blue-400">Cliques: {(data.cliques || 0).toLocaleString()}</p>
          <p className="text-green-400">Percentual: {(data.percentual || 0).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  // Verificar se há dados para exibir
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-4 text-center">
          Cliques por Sub ID (Top 10)
        </h4>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-white mb-4 text-center">
        Cliques por Sub ID (Top 10)
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
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
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
