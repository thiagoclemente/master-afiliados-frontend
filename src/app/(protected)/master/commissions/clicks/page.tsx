'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MousePointer, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { 
  commissionsService, 
  ClickReport, 
  ReportHistory
} from "@/services/commissions.service";
import { useAuth } from "@/context/auth-context";
import ClickReportDisplay from "./components/ClickReportDisplay";

export default function ClicksPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { logout } = useAuth();

  // Load report history on component mount
  useEffect(() => {
    const history = commissionsService.getReportHistory();
    const clicksHistory = history.filter(h => h.type === 'clicks');
    setReportHistory(clicksHistory);
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      showErrorMessage('Por favor, selecione um arquivo CSV válido.');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const reportData = await commissionsService.uploadClicksFile(file);

      const newReport: ReportHistory = {
        id: Date.now().toString(),
        fileName: file.name,
        filePath: URL.createObjectURL(file),
        type: 'clicks',
        createdAt: new Date().toISOString(),
        data: reportData
      };

      commissionsService.saveReportHistory(newReport);
      const history = commissionsService.getReportHistory();
      const clicksHistory = history.filter(h => h.type === 'clicks');
      setReportHistory(clicksHistory);
      setSelectedReport(newReport);
      showSuccessMessage('Relatório de cliques processado com sucesso!');
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar o arquivo. Tente novamente.';
      if (errorMessage === "Authentication failed" || errorMessage === "Authentication required") {
        logout();
        router.push("/login");
        return;
      }
      showErrorMessage(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const clearAllData = () => {
    const history = commissionsService.getReportHistory();
    const nonClicksHistory = history.filter(h => h.type !== 'clicks');
    commissionsService.clearReportHistory();
    nonClicksHistory.forEach(h => commissionsService.saveReportHistory(h));
    setReportHistory([]);
    setSelectedReport(null);
    showSuccessMessage('Todos os relatórios de cliques foram removidos.');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/master/commissions')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                <MousePointer className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Meus Cliques Shopee</h1>
                <p className="text-gray-400">Analise seus cliques e tráfego</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-900 border border-green-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-200">{successMessage}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!selectedReport && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-400 bg-blue-900/20"
                : "border-gray-600 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                <p className="text-gray-400">Processando arquivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-white mb-2">
                  Faça upload do seu arquivo CSV de cliques
                </p>
                <p className="text-gray-400 mb-4">
                  Arraste e solte um arquivo CSV com relatório de cliques da Shopee
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Selecionar arquivo CSV
                </label>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-200 mb-1">
                Como usar:
              </h3>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>1. Baixe o relatório CSV de cliques da sua plataforma de afiliados</li>
                <li>2. Faça upload do arquivo aqui</li>
                <li>3. Visualize suas métricas e insights automaticamente</li>
                <li>4. Acesse o histórico para comparar relatórios anteriores</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {selectedReport && (
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Relatório: {selectedReport.fileName}
              </h2>
              <p className="text-gray-400">
                {formatDate(selectedReport.createdAt)} • Cliques
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Novo Relatório
              </button>
            </div>
          </div>

          <ClickReportDisplay report={selectedReport.data as ClickReport} />
        </div>
      )}

      {/* History */}
      {!selectedReport && reportHistory.length > 0 && (
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Histórico de Relatórios de Cliques</h2>
            <button
              onClick={clearAllData}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar tudo</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportHistory.slice(0, 6).map((report) => (
              <div
                key={report.id}
                className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-gray-500 cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-400">Cliques</span>
                </div>
                <p className="font-medium text-white text-sm mb-1 truncate">
                  {report.fileName}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(report.createdAt)}
                </p>
                {report.type === 'clicks' && 'total_cliques' in report.data && (
                  <p className="text-sm text-blue-400 mt-2">
                    {(report.data.total_cliques as number).toLocaleString()} cliques
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 