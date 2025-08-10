'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CommissionReport } from '@/services/commissions.service';
import { TooltipProps } from './types';

interface SummaryDonutChartProps {
  report: CommissionReport;
}

export default function SummaryDonutChart({ report }: SummaryDonutChartProps) {
  const totalComissoes = report.total_comissoes;
  const totalPedidos = report.total_pedidos;
  
  // Criar dados para o gráfico de donut mostrando a proporção
  const chartData = [
    {
      name: 'Comissões',
      value: totalComissoes,
      color: '#10B981'
    },
    {
      name: 'Base de Vendas',
      value: totalComissoes * 0.1, // Estimativa da base de vendas (10% da comissão)
      color: '#6B7280'
    }
  ];

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
          <p className="text-green-400">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-white mb-4 text-center">
        Resumo Geral
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-4 space-y-2">
        <div className="text-2xl font-bold text-green-400">
          {formatCurrency(totalComissoes)}
        </div>
        <div className="text-sm text-gray-300">
          Total de {totalPedidos.toLocaleString()} pedidos
        </div>
      </div>
    </div>
  );
}
