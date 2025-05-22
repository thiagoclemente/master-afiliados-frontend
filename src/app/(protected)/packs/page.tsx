"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchPacks } from "@/services/pack.service";
import type { Pack } from "@/services/pack.service";
import Image from "next/image";

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const loadPacks = async () => {
      try {
        setIsLoading(true);
        const response = await fetchPacks(currentPage, 20);
        setPacks(response.data);
        setTotalPages(response.meta.pagination.pageCount);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          if (
            err.message === "Authentication failed" ||
            err.message === "Authentication required"
          ) {
            logout();
            router.push("/login");
            return;
          }
          setError(err.message);
        } else {
          setError("Erro ao carregar os pacotes");
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPacks();
  }, [currentPage, logout, router]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePackClick = (packId: string) => {
    router.push(`/videos?pack=${packId}`);
  };

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Pacotes</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map((pack) => (
              <div
                key={pack.documentId}
                className="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePackClick(pack.documentId)}
              >
                <div className="relative aspect-video">
                  {pack.image?.url ? (
                    <Image
                      src={pack.image.url}
                      alt={`Capa do pacote ${pack.title}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Sem imagem</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {pack.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {pack.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
