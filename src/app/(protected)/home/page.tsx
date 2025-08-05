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
      title: "Comissões Master",
      description: "Métricas de vendas e cliquespara afiliados Shoppe",
      href: "/master/commissions",
      icon: "📊", // gráfico de barras para métricas
      color: "bg-purple-600", // roxo para diferenciar do restante e remeter a algo premium/master
    },
    {
      title: "Controle Master",
      description: "Ferramenta para controle das suas campanhas de anúncios",
      href: "/master/control",
      icon: "🛠️", // ferramenta para controle/gerenciamento
      color: "bg-indigo-700", // azul escuro para remeter a controle e seriedade
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
      </div>
    </div>
  );
}
