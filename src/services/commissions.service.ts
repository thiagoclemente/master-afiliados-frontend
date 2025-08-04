import { getAuthToken } from "@/lib/auth";

export interface ComissaoPorCanal {
  canal: string;
  comissao: number;
  total_pedidos: number;
  por_status: Record<string, number>;
}

export interface ComissaoPorSubId {
  sub_id: string;
  comissao: number;
  total_pedidos: number;
}

export interface CliquePorCanal {
  canal: string;
  cliques: number;
  percentual: number;
}

export interface CliquePorHora {
  faixa_horario: string;
  total_cliques: number;
}

export interface CliquePorSubId {
  sub_id: string;
  cliques: number;
  percentual: number;
}

export interface CliquePorRegiao {
  regiao: string;
  cliques: number;
}

export interface CommissionReport {
  total_comissoes: number;
  total_pedidos: number;
  comissoes_por_canal: ComissaoPorCanal[];
  comissoes_por_subid: ComissaoPorSubId[];
  periodo: string;
  canal_top_vendas: string;
  subid_top_vendas: string;
}

export interface ClickReport {
  total_cliques: number;
  cliques_por_canal: CliquePorCanal[];
  cliques_por_hora: CliquePorHora[];
  cliques_por_subid: CliquePorSubId[];
  cliques_por_regiao: CliquePorRegiao[];
  periodo: string;
  melhor_horario_postagem: string;
  canal_top_cliques: string;
  subid_top_cliques: string;
  regiao_top_cliques: string;
}

export interface ReportHistory {
  id: string;
  fileName: string;
  filePath: string;
  type: 'commissions' | 'clicks';
  createdAt: string;
  data: CommissionReport | ClickReport;
}

class CommissionsService {
  private MY_METRICS_URL = process.env.NEXT_PUBLIC_MY_METRICS || 'https://my-metrics.masterafiliados.com.br';

  async uploadCommissionsFile(file: File): Promise<CommissionReport> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.MY_METRICS_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Authentication failed");
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail?.[0]?.msg || errorData.detail || "Erro ao processar arquivo de comissões");
    }

    const data = await response.json();
    return data;
  }

  async uploadClicksFile(file: File): Promise<ClickReport> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.MY_METRICS_URL}/upload-clicks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Authentication failed");
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail?.[0]?.msg || errorData.detail || "Erro ao processar arquivo de cliques");
    }

    const data = await response.json();
    return data;
  }

  // Local storage for report history
  private getReportHistoryKey(): string {
    return 'commissions_master_history';
  }

  getReportHistory(): ReportHistory[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const history = localStorage.getItem(this.getReportHistoryKey());
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  saveReportHistory(history: ReportHistory): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existingHistory = this.getReportHistory();
      const updatedHistory = [history, ...existingHistory];
      localStorage.setItem(this.getReportHistoryKey(), JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  deleteReportHistory(id: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existingHistory = this.getReportHistory();
      const updatedHistory = existingHistory.filter(h => h.id !== id);
      localStorage.setItem(this.getReportHistoryKey(), JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erro ao deletar histórico:', error);
    }
  }

  clearReportHistory(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.getReportHistoryKey());
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }
}

export const commissionsService = new CommissionsService(); 