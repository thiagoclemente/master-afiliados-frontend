'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ComissaoPorSubId } from '@/services/commissions.service';
import { TooltipProps } from './types';

interface CommissionsBySubIdChartProps {
  data: ComissaoPorSubId[];
}

export default function CommissionsBySubIdChart({ data }: CommissionsBySubIdChartProps) {
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.sub_id.length > 15 ? `${item.sub_id.substring(0, 15)}...` : item.sub_id,
    comissao: item.comissao,
    pedidos: item.total_pedidos,
    fullName: item.sub_id
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.fullName}</p>
          <p className="text-green-400">Comissão: {formatCurrency(data.comissao || 0)}</p>
          <p className="text-gray-300">Pedidos: {data.pedidos}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-white mb-4 text-center">
        Comissões por Sub ID (Top 10)
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
              tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="comissao" 
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
