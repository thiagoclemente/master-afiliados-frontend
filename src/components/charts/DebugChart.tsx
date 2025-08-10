'use client';

interface DebugChartProps {
  data: unknown[];
  title: string;
}

export default function DebugChart({ data, title }: DebugChartProps) {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-white mb-4 text-center">
        Debug: {title}
      </h4>
      <div className="space-y-2">
        <p className="text-sm text-gray-300">Total de itens: {data?.length || 0}</p>
        <div className="bg-gray-800 p-3 rounded">
          <pre className="text-xs text-gray-300 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
