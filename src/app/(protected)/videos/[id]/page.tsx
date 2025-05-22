"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchVideos } from "@/services/video.service";
import type { Video } from "@/services/video.service";
import { ArrowLeft } from "lucide-react";

export default function VideoDetailsPage() {
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setIsLoading(true);
        const response = await fetchVideos(
          1,
          1,
          undefined,
          params.id as string
        );
        if (response.data.length === 0) {
          throw new Error("Vídeo não encontrado");
        }
        setVideo(response.data[0]);
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
          setError("Erro ao carregar o vídeo");
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadVideo();
    }
  }, [params.id, logout, router]);

  const handleDownload = () => {
    if (video?.video?.url) {
      window.open(video.video.url, "_blank");
    }
  };

  const handleBack = () => {
    history.back();
  };

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-gray-500 text-center">Vídeo não encontrado</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para lista
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">{video.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player - Takes 2/3 of the space */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {video.video?.url ? (
                <video
                  controls
                  className="w-full h-full"
                  poster={video.coverImage?.url}
                >
                  <source src={video.video.url} type="video/mp4" />
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  Vídeo não disponível
                </div>
              )}
            </div>

            {/* Download Button */}
            {video.video?.url && (
              <div className="mt-4">
                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Baixar Vídeo
                </button>
              </div>
            )}
          </div>

          {/* Video Info - Takes 1/3 of the space */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Informações
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600 block">Categoria:</span>
                  <span className="text-gray-900">{video.category?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Data de criação:</span>
                  <span className="text-gray-900">
                    {new Date(video.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block">
                    Última atualização:
                  </span>
                  <span className="text-gray-900">
                    {new Date(video.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {video.link && (
                  <div>
                    <span className="text-gray-600 block mb-2">Links:</span>
                    <a
                      href={video.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Acessar produto
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
