"use client";

export default function StickersPage() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Stickers</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Placeholder for sticker content */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div
            key={item}
            className="bg-gray-100 rounded-lg p-4 aspect-square flex items-center justify-center"
          >
            <span className="text-gray-500">Sticker {item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
