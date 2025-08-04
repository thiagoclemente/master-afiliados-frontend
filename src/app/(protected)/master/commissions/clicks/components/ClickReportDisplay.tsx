'use client';

import { 
  MousePointer, 
  Clock,
  Globe,
  Layers,
  MapPin,
  BarChart3
} from 'lucide-react';
import { 
  ClickReport,
  CliquePorCanal,
  CliquePorHora,
  CliquePorSubId,
  CliquePorRegiao
} from "@/services/commissions.service";

// Helper function for channel icons
const getChannelIcon = (channel: string) => {
  switch (channel.toLowerCase()) {
    case 'instagram': return '📸';
    case 'facebook': return '📘';
    case 'whatsapp': return '💬';
    case 'youtube': return '📺';
    case 'telegram': return '📱';
    case 'email': return '📧';
    case 'websites': return '🌐';
    case 'google search': return '🔍';
    case 'google play': return '📱';
    case 'app store': return '🍎';
    case 'edgebrowser': return '🌐';
    case 'shopeevideo-shopee': return '🛒';
    case 'others': return '📊';
    default: return '📊';
  }
};

export default function ClickReportDisplay({ report }: { report: ClickReport }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-400 font-medium">Total de Cliques</p>
              <p className="text-2xl font-bold text-blue-300">
                {report.total_cliques.toLocaleString()}
              </p>
            </div>
            <MousePointer className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-400 font-medium">Melhor Horário</p>
              <p className="text-lg font-bold text-green-300">
                {report.melhor_horario_postagem}
              </p>
              <p className="text-xs text-green-500 mt-1">Horário com mais cliques</p>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-400 font-medium">Canal Top Cliques</p>
              <p className="text-lg font-bold text-purple-300">
                {report.canal_top_cliques}
              </p>
              <p className="text-xs text-purple-500 mt-1">Canal com mais cliques</p>
            </div>
            <Globe className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-400 font-medium">Sub ID Top Cliques</p>
              <p className="text-lg font-bold text-orange-300">
                {report.subid_top_cliques}
              </p>
              <p className="text-xs text-orange-500 mt-1">Sub ID com mais cliques</p>
            </div>
            <Layers className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-400 font-medium">Região Top Cliques</p>
              <p className="text-lg font-bold text-red-300">
                {report.regiao_top_cliques}
              </p>
              <p className="text-xs text-red-500 mt-1">Região com mais cliques</p>
            </div>
            <MapPin className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Period */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">{report.periodo}</h3>
      </div>

      {/* Detailed Reports */}
      <div className="space-y-6">
        {/* Cliques por Canal */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Cliques por Canal</span>
          </h3>
          <div className="space-y-3">
            {report.cliques_por_canal.map((item: CliquePorCanal, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getChannelIcon(item.canal)}</span>
                  <span className="font-medium text-white">{item.canal}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-blue-400 font-medium">{item.cliques.toLocaleString()} cliques</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-green-400 font-medium">{item.percentual.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cliques por Hora */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-green-400" />
            <span>Cliques por Hora</span>
          </h3>
          <div className="space-y-3">
            {report.cliques_por_hora.map((item: CliquePorHora, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-white">{item.faixa_horario}</span>
                </div>
                <span className="text-green-400 font-medium">{item.total_cliques.toLocaleString()} cliques</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cliques por Sub ID */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-orange-400" />
            <span>Cliques por Sub ID</span>
          </h3>
          <div className="space-y-3">
            {report.cliques_por_subid.map((item: CliquePorSubId, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                <span className="font-medium text-white">{item.sub_id}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-blue-400 font-medium">{item.cliques.toLocaleString()} cliques</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-green-400 font-medium">{item.percentual.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cliques por Região */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-red-400" />
            <span>Cliques por Região</span>
          </h3>
          <div className="space-y-3">
            {report.cliques_por_regiao.map((item: CliquePorRegiao, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-white">{item.regiao}</span>
                </div>
                <span className="text-red-400 font-medium">{item.cliques.toLocaleString()} cliques</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 