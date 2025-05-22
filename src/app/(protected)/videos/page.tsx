"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchVideos } from "@/services/video.service";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";
import { ArrowLeft } from "lucide-react";
import { ImageInterface } from "@/interfaces/image.interface";

interface VideoFormat {
  url: string;
  ext: string;
  size: number;
  mime: string;
}

interface Category {
  id: number;
  name: string;
}

interface VideoModel {
  id: number;
  url: string;
  formats: {
    thumbnail: VideoFormat;
  };
}

interface Pack {
  id: number;
  url: string;
}

interface Video {
  id: number;
  documentId: string;
  title: string;
  link: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  video: VideoModel;
  pack: Pack;
  category: Category;
  coverImage: ImageInterface;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();

  const packId = searchParams.get("pack");

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsLoading(true);
        const response = await fetchVideos(
          currentPage,
          20,
          debouncedSearch,
          undefined,
          packId || undefined
        );
        setVideos(response.data);
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
          setError("Erro ao carregar os vídeos");
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideos();
  }, [currentPage, debouncedSearch, packId, logout, router]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleBack = () => {
    router.push("/packs");
  };

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (!packId) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-gray-500 text-center">
          Selecione um pacote para ver os vídeos
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para pacotes
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Vídeos</h1>
        </div>
        <div className="w-64">
          <input
            type="text"
            placeholder="Buscar vídeos..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <div
                key={video.documentId}
                className="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-video">
                  {video.coverImage?.formats?.medium?.url ? (
                    <Image
                      src={video.coverImage.formats.medium.url}
                      alt={`Capa do vídeo ${video.title}`}
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
                    <a
                      href={`/videos/${video.documentId}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {video.title}
                    </a>
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {video.category?.name}
                  </p>
                  <div className="flex space-x-4">
                    <a
                      href={`/videos/${video.documentId}`}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Ver detalhes
                    </a>
                    {video.link && (
                      <a
                        href={video.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Acessar vídeo
                      </a>
                    )}
                  </div>
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
