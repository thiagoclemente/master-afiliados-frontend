"use client";

export default function VideosPage() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Vídeos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for video content */}
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="bg-gray-100 rounded-lg p-4 aspect-video flex items-center justify-center"
          >
            <span className="text-gray-500">Vídeo {item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
