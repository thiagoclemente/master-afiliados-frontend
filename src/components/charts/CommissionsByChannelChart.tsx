'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ComissaoPorCanal } from '@/services/commissions.service';
import { TooltipProps, LegendProps } from './types';

interface CommissionsByChannelChartProps {
  data: ComissaoPorCanal[];
}



const COLORS = [
  '#10B981', // green-500
  '#3B82F6', // blue-500
  '#8B5CF6', // purple-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
];

export default function CommissionsByChannelChart({ data }: CommissionsByChannelChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.canal,
    value: item.comissao,
    pedidos: item.total_pedidos,
    color: COLORS[index % COLORS.length]
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
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-green-400">Comissão: {formatCurrency(data.value)}</p>
          <p className="text-gray-300">Pedidos: {data.pedidos}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: LegendProps) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload?.map((entry, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-300">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Verificar se há dados para exibir
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-4 text-center">
          Comissões por Canal
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
        Distribuição de Comissões por Canal
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
