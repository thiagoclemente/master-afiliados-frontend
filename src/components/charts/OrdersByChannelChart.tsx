'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ComissaoPorCanal } from '@/services/commissions.service';
import { TooltipProps } from './types';

interface OrdersByChannelChartProps {
  data: ComissaoPorCanal[];
}

export default function OrdersByChannelChart({ data }: OrdersByChannelChartProps) {
  const chartData = data.map((item) => ({
    name: item.canal.length > 12 ? `${item.canal.substring(0, 12)}...` : item.canal,
    pedidos: item.total_pedidos,
    comissao: item.comissao,
    fullName: item.canal
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
          <p className="text-blue-400">Pedidos: {data.pedidos}</p>
          <p className="text-green-400">Comissão: {formatCurrency(data.comissao || 0)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-white mb-4 text-center">
        Pedidos por Canal
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="pedidos" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
