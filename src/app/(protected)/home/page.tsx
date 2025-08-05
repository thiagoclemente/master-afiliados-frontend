"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { 
  Palette, 
  Video, 
  StickyNote, 
  BarChart3, 
  Settings, 
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  const menuItems = [
    {
      title: "Artes",
      description: "Acesse nossa biblioteca de artes para suas campanhas",
      href: "/arts",
      icon: Palette,
      color: "bg-blue-500",
    },
    {
      title: "Pacotes de Vídeos",
      description: "Combos de vídeos promocionais para suas estratégias de marketing",
      href: "/combos",
      icon: Video,
      color: "bg-red-500",
    },
    {
      title: "Stickers",
      description: "Stickers personalizados para suas redes sociais",
      href: "/stickers",
      icon: StickyNote,
      color: "bg-green-500",
    },
    {
      title: "Comissões Master",
      description: "Métricas de vendas e cliquespara afiliados Shoppe",
      href: "/master/commissions",
      icon: BarChart3,
      color: "bg-purple-600",
    },
    {
      title: "Controle Master",
      description: "Ferramenta para controle das suas campanhas de anúncios",
      href: "/master/control",
      icon: Settings,
      color: "bg-indigo-700",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Master Afiliados
              </h1>
              <p className="text-gray-300 mt-1">
                Bem-vindo de volta, {user?.username}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#7d570e] to-[#6b4a0c] rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-yellow-300 mr-3" />
              <h2 className="text-2xl font-bold">
                Sua Central de Conteúdo
              </h2>
            </div>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Aqui você encontrará todo o conteúdo necessário para suas campanhas de
              afiliados. Escolha uma categoria abaixo para começar.
            </p>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group block bg-black rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 border border-gray-800"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center text-white mr-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-[#7d570e] transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-gray-300 group-hover:text-gray-200 transition-colors">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center text-[#7d570e] group-hover:text-[#6b4a0c] transition-colors">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        {/* <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Artes</p>
                <p className="text-2xl font-bold text-white">150+</p>
              </div>
              <Palette className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Vídeos Disponíveis</p>
                <p className="text-2xl font-bold text-white">50+</p>
              </div>
              <Video className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div> */}

        {/* Additional Features
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center mb-4">
              <Zap className="w-6 h-6 text-yellow-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">Performance</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Acompanhe seus resultados em tempo real e otimize suas campanhas para maximizar seus ganhos.
            </p>
          </div>
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center mb-4">
              <Layers className="w-6 h-6 text-blue-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">Conteúdo Premium</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Acesso exclusivo a artes, vídeos e stickers de alta qualidade para suas estratégias de marketing.
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
