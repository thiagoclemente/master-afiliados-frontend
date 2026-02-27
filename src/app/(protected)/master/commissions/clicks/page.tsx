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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle
} from '@/components/ui/card';
import SubscriptionProtection from '@/components/SubscriptionProtection';
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
    // Criar data em UTC para evitar problemas de timezone
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  return (
    <SubscriptionProtection type="commissions">
      <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/master/commissions')}
              variant="ghost"
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
                <MousePointer className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Meus Cliques Shopee</h1>
                <p className="text-muted-foreground">Analise seus cliques e tráfego</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert className="mb-6 border-green-700/60 bg-green-950/40 text-green-100 [&>svg]:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-700/60 bg-red-950/40 text-red-100 [&>svg]:text-red-400">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Area */}
        {!selectedReport && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-400 bg-blue-900/30"
                : "border-gray-700 hover:border-gray-500"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                <p className="text-muted-foreground">Processando arquivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Faça upload do seu arquivo CSV de cliques
                </p>
                <p className="text-muted-foreground mb-4">
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
                  className="cursor-pointer inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Selecionar arquivo CSV
                </label>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <Alert className="mt-6 border-blue-700/60 bg-blue-950/30 text-blue-100 [&>svg]:text-blue-400">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Como usar</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              <li>1. Baixe o relatório CSV de cliques da sua plataforma de afiliados</li>
              <li>2. Faça upload do arquivo aqui</li>
              <li>3. Visualize suas métricas e insights automaticamente</li>
              <li>4. Acesse o histórico para comparar relatórios anteriores</li>
            </ul>
          </AlertDescription>
        </Alert>
        </CardContent>
      </Card>

      {/* Report Display */}
      {selectedReport && (
        <Card>
          <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-xl">
                Relatório: {selectedReport.fileName}
              </CardTitle>
              <CardDescription>
                {formatDate(selectedReport.createdAt)} • Cliques
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setSelectedReport(null)}
                variant="secondary"
              >
                Novo Relatório
              </Button>
            </div>
          </div>

          <ClickReportDisplay report={selectedReport.data as ClickReport} />
          </CardContent>
        </Card>
      )}

      {/* History */}
      {!selectedReport && reportHistory.length > 0 && (
        <Card>
          <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Histórico de Relatórios de Cliques</h2>
            <Button
              onClick={clearAllData}
              variant="ghost"
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar tudo</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportHistory.slice(0, 6).map((report) => (
              <div
                key={report.id}
                className="bg-card border rounded-lg p-4 hover:border-muted-foreground/40 cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cliques</span>
                </div>
                <p className="font-medium text-foreground text-sm mb-1 truncate">
                  {report.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
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
          </CardContent>
        </Card>
      )}
      </div>
    </SubscriptionProtection>
  );
}
