"use client";

import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">
        Bem-vindo, {user?.username}!
      </h1>
      <p className="text-gray-600">
        Aqui você encontrará todo o conteúdo necessário para suas campanhas de
        afiliados.
      </p>
    </div>
  );
}
