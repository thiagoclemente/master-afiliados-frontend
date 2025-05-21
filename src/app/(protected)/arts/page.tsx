"use client";

export default function ArtsPage() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Artes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for art content */}
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="bg-gray-100 rounded-lg p-4 aspect-square flex items-center justify-center"
          >
            <span className="text-gray-500">Arte {item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
