'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CliquePorHora } from '@/services/commissions.service';
import { TooltipProps } from './types';

interface ClicksByHourChartProps {
  data: CliquePorHora[];
}

export default function ClicksByHourChart({ data }: ClicksByHourChartProps) {
  console.log('ClicksByHourChart data:', data);
  
  // Criar array com todos os horários do dia (00:00-23:59)
  const todosHorarios = [];
  for (let i = 0; i < 24; i++) {
    const hora = i.toString().padStart(2, '0');
    const faixaHorario = `${hora}:00-${hora}:59`;
    todosHorarios.push(faixaHorario);
  }
  
  // Calcular total de cliques para percentuais
  const totalCliques = data.reduce((sum, item) => sum + item.total_cliques, 0);
  
  // Criar dados do gráfico com todos os horários, incluindo os sem cliques
  const chartData = todosHorarios.map((faixaHorario) => {
    const itemExistente = data.find(item => item.faixa_horario === faixaHorario);
    const cliques = itemExistente ? itemExistente.total_cliques : 0;
    const percentual = totalCliques > 0 ? ((cliques / totalCliques) * 100) : 0;
    
    return {
      name: faixaHorario,
      cliques: cliques,
      percentual: percentual
    };
  });
  
  console.log('ClicksByHourChart chartData:', chartData);

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-green-400">Cliques: {(data.cliques || 0).toLocaleString()}</p>
          <p className="text-blue-400">Percentual: {(data.percentual || 0).toFixed(1)}%</p>
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
          Cliques por Hora
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
        Distribuição de Cliques por Hora (24h)
      </h4>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9CA3AF"
              fontSize={10}
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
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
