"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();

  const menuItems = [
    {
      title: "Artes",
      description: "Acesse nossa biblioteca de artes para suas campanhas",
      href: "/arts",
      icon: "🎨",
      color: "bg-blue-500",
    },
    {
      title: "Pacotes de Vídeos",
      description: "Combos de vídeos promocionais para suas estratégias de marketing",
      href: "/combos",
      icon: "🎥",
      color: "bg-red-500",
    },
    {
      title: "Stickers",
      description: "Stickers personalizados para suas redes sociais",
      href: "/stickers",
      icon: "📱",
      color: "bg-green-500",
    },
    {
      title: "Packs",
      description: "Pacotes completos de conteúdo para suas campanhas",
      href: "/packs",
      icon: "📦",
      color: "bg-purple-500",
    },
    {
      title: "Master",
      description: "Conteúdo exclusivo para afiliados master",
      href: "/master",
      icon: "👑",
      color: "bg-yellow-500",
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
            <h2 className="text-2xl font-bold mb-4">
              Sua Central de Conteúdo
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Aqui você encontrará todo o conteúdo necessário para suas campanhas de
              afiliados. Escolha uma categoria abaixo para começar.
            </p>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group block bg-black rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 border border-gray-800"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center text-white text-2xl mr-4`}>
                    {item.icon}
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
                  <svg
                    className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-black rounded-lg shadow-md p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            Resumo Rápido
          </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-black rounded-lg border border-blue-800">
                <div className="text-2xl font-bold text-blue-300">150+</div>
                <div className="text-sm text-gray-300">Artes Disponíveis</div>
              </div>
              <div className="text-center p-4 bg-black rounded-lg border border-red-800">
                <div className="text-2xl font-bold text-red-300">50+</div>
                <div className="text-sm text-gray-300">Vídeos</div>
              </div>
              <div className="text-center p-4 bg-black rounded-lg border border-green-800">
                <div className="text-2xl font-bold text-green-300">200+</div>
                <div className="text-sm text-gray-300">Stickers</div>
              </div>
              <div className="text-center p-4 bg-black rounded-lg border border-purple-800">
                <div className="text-2xl font-bold text-purple-300">25+</div>
                <div className="text-sm text-gray-300">Packs Completos</div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
