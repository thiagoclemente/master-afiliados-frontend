// Control Master Service
export interface UserAdItem {
  id: number;
  documentId: string;
  date: string;
  valueDailyInvestment: number;
  valueTotalSalesDay: number;
  valueTotalCpc: number;
  totalClicks: string;
  totalImpressions: string;
  notes: string;
}

export interface UserAd {
  id: number;
  documentId: string;
  name: string;
  date: string;
  items: UserAdItem[];
}

export interface CreateAdRequest {
  name: string;
  date: string;
  user: string;
}

export interface UpdateAdRequest {
  documentId: string;
  name?: string;
  date?: string;
}

export interface UpdateAdItemRequest {
  date?: string;
  valueDailyInvestment?: number;
  valueTotalSalesDay?: number;
  valueTotalCpc?: number;
  totalClicks?: string;
  totalImpressions?: string;
  notes?: string;
}

export interface MonthlySummary {
  totalInvestment: number;
  totalSales: number;
  totalProfit: number;
  totalRoi: number;
  totalClicks: number;
  totalImpressions: number;
  averageCpc: number;
}

// API Response interfaces
interface ApiUserAdItem {
  id: number;
  documentId?: string;
  date?: string;
  valueDailyInvestment?: number;
  valueTotalSalesDay?: number;
  valueTotalCpc?: number;
  totalClicks?: string;
  totalImpressions?: string;
  notes?: string;
}

interface ApiUserAd {
  id: number;
  documentId?: string;
  name?: string;
  date?: string;
  items?: ApiUserAdItem[];
}

interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

class ControlMasterService {
  private API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.masterafiliados.com.br';

  private async getAuthToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.jwt;
        } catch (error) {
          console.error('Error parsing user data:', error);
          return null;
        }
      }
    }
    return null;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      if (response.status === 403) {
        throw new Error('Access denied');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response has content (for DELETE operations that return 204 No Content)
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
      return null; // Return null for empty responses
    }

    return response.json();
  }

  // Get a specific user ad by documentId
  async getUserAdByDocumentId(documentId: string, queryParams: string = ''): Promise<UserAd | null> {
    try {
      const result = await this.makeRequest(`/api/user-ads?filters[documentId][$eq]=${documentId}&${queryParams}`) as ApiResponse<ApiUserAd[]>;
      

      
      if (result.data && result.data.length > 0) {
        const item = result.data[0];
        return {
          id: item.id,
          documentId: item.documentId || `ad-${item.id}`,
          name: item.name || 'Campanha sem nome',
          date: item.date || new Date().toISOString().split('T')[0],
          items: (item.items || []).map((itemData: ApiUserAdItem) => {
            return {
              id: itemData.id,
              documentId: itemData.documentId || `item-${itemData.id}`,
              date: itemData.date || new Date().toISOString().split('T')[0],
              valueDailyInvestment: itemData.valueDailyInvestment || 0,
              valueTotalSalesDay: itemData.valueTotalSalesDay || 0,
              valueTotalCpc: itemData.valueTotalCpc || 0,
              totalClicks: itemData.totalClicks || '0',
              totalImpressions: itemData.totalImpressions || '0',
              notes: itemData.notes || '',
            };
          }),
        };
      }
      
      return null;
    } catch (error) {

      throw error;
    }
  }

  // Get all user ads with optional filtering
  async getUserAds(queryParams: string = ''): Promise<UserAd[]> {
    try {
      const result = await this.makeRequest(`/api/user-ads?${queryParams}`) as ApiResponse<ApiUserAd[]>;
      

      
      if (result.data && Array.isArray(result.data)) {
        return result.data.map((item: ApiUserAd) => {
          // The API returns data directly, not in attributes
          return {
            id: item.id,
            documentId: item.documentId || `ad-${item.id}`,
            name: item.name || 'Campanha sem nome',
            date: item.date || new Date().toISOString().split('T')[0],
            items: (item.items || []).map((itemData: ApiUserAdItem) => {
              return {
                id: itemData.id,
                documentId: itemData.documentId || `item-${itemData.id}`,
                date: itemData.date || new Date().toISOString().split('T')[0],
                valueDailyInvestment: itemData.valueDailyInvestment || 0,
                valueTotalSalesDay: itemData.valueTotalSalesDay || 0,
                valueTotalCpc: itemData.valueTotalCpc || 0,
                totalClicks: itemData.totalClicks || '0',
                totalImpressions: itemData.totalImpressions || '0',
                notes: itemData.notes || '',
              };
            }),
          };
        });
      }
      
      return [];
    } catch (error) {

      throw error;
    }
  }

  // Create a new ad
  async createAd(userDocumentId: string, data: CreateAdRequest): Promise<UserAd> {
    try {
      const result = await this.makeRequest('/api/user-ads?populate=items', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: data.name,
            date: data.date,
            user: userDocumentId,
          }
        }),
      }) as ApiResponse<ApiUserAd>;

      // The API returns data directly, not in attributes
      return {
        id: result.data?.id || Date.now(),
        documentId: result.data?.documentId || `ad-${Date.now()}`,
        name: result.data?.name || data.name,
        date: result.data?.date || data.date,
        items: [],
      };
    } catch (error) {

      throw error;
    }
  }

  // Update an existing ad
  async updateAd(data: UpdateAdRequest): Promise<UserAd> {
    try {
      const endpoint = `/api/user-ads/${data.documentId}?populate=items`;
      const requestBody = {
        data: {
          ...(data.name && { name: data.name }),
          ...(data.date && { date: data.date }),
        }
      };
      
      const result = await this.makeRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      }) as ApiResponse<ApiUserAd>;

      return {
        id: result.data?.id || 0,
        documentId: result.data?.documentId || data.documentId,
        name: result.data?.name || data.name || 'Campanha sem nome',
        date: result.data?.date || data.date || new Date().toISOString().split('T')[0],
        items: (result.data?.items || []).map((item: ApiUserAdItem) => ({
          id: item.id,
          documentId: item.documentId || `item-${item.id}`,
          date: item.date || new Date().toISOString().split('T')[0],
          valueDailyInvestment: item.valueDailyInvestment || 0,
          valueTotalSalesDay: item.valueTotalSalesDay || 0,
          valueTotalCpc: item.valueTotalCpc || 0,
          totalClicks: item.totalClicks || '0',
          totalImpressions: item.totalImpressions || '0',
          notes: item.notes || '',
        })),
      };
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  }

  // Delete an ad
  async deleteAd(documentId: string): Promise<void> {
    try {
      await this.makeRequest(`/api/user-ads/${documentId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  }

  // Update an existing ad item
  async updateAdItem(documentId: string, data: UpdateAdItemRequest): Promise<UserAdItem> {
    try {
      const result = await this.makeRequest(`/api/user-ad-items/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            ...(data.date && { date: data.date }),
            ...(data.valueDailyInvestment !== undefined && { valueDailyInvestment: data.valueDailyInvestment }),
            ...(data.valueTotalSalesDay !== undefined && { valueTotalSalesDay: data.valueTotalSalesDay }),
            ...(data.valueTotalCpc !== undefined && { valueTotalCpc: data.valueTotalCpc }),
            ...(data.totalClicks && { totalClicks: data.totalClicks }),
            ...(data.totalImpressions && { totalImpressions: data.totalImpressions }),
            ...(data.notes && { notes: data.notes }),
          }
        }),
      }) as ApiResponse<ApiUserAdItem>;

      // The API returns data directly, not in attributes
      return {
        id: result.data?.id || 0,
        documentId: result.data?.documentId || documentId,
        date: result.data?.date || data.date || '',
        valueDailyInvestment: result.data?.valueDailyInvestment || data.valueDailyInvestment || 0,
        valueTotalSalesDay: result.data?.valueTotalSalesDay || data.valueTotalSalesDay || 0,
        valueTotalCpc: result.data?.valueTotalCpc || data.valueTotalCpc || 0,
        totalClicks: result.data?.totalClicks || data.totalClicks || '0',
        totalImpressions: result.data?.totalImpressions || data.totalImpressions || '0',
        notes: result.data?.notes || data.notes || '',
      };
    } catch (error) {
      console.error('Error updating ad item:', error);
      throw error;
    }
  }

  // Get monthly summary
  getMonthlySummary(ads: UserAd[], monthYear: string): MonthlySummary {
    // Use the same filtering logic as getAdsByMonth
    const [month, year] = monthYear.split('/');
    const expectedPrefix = `${year}-${month.padStart(2, '0')}`;
    const monthAds = ads.filter(ad => ad.date.startsWith(expectedPrefix));
    
    let totalInvestment = 0;
    let totalSales = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalCpc = 0;
    let itemCount = 0;

    monthAds.forEach(ad => {
      ad.items.forEach(item => {
        totalInvestment += item.valueDailyInvestment;
        totalSales += item.valueTotalSalesDay;
        totalClicks += parseInt(item.totalClicks) || 0;
        totalImpressions += parseInt(item.totalImpressions) || 0;
        totalCpc += item.valueTotalCpc;
        itemCount++;
      });
    });

    const totalProfit = totalSales - totalInvestment;
    const totalRoi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    const averageCpc = itemCount > 0 ? totalCpc / itemCount : 0;

    return {
      totalInvestment,
      totalSales,
      totalProfit,
      totalRoi,
      totalClicks,
      totalImpressions,
      averageCpc,
    };
  }

  // Get ads by month
  getAdsByMonth(ads: UserAd[], monthYear: string): UserAd[] {
    // monthYear is in format "MM/YYYY", but ad.date is in format "YYYY-MM-DD"
    // We need to check if the ad.date starts with the year and month
    const [month, year] = monthYear.split('/');
    const expectedPrefix = `${year}-${month.padStart(2, '0')}`;
    
    return ads.filter(ad => {
      const matches = ad.date.startsWith(expectedPrefix);
      return matches;
    });
  }

  // Format month/year string
  formatMonthYear(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
  }

  // Parse month/year string to Date
  parseMonthYear(monthYear: string): Date {
    const [month, year] = monthYear.split('/');
    return new Date(parseInt(year), parseInt(month) - 1);
  }

  // Get previous month
  getPreviousMonth(currentDate: Date): Date {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
  }

  // Get next month
  getNextMonth(currentDate: Date): Date {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }

  // Format currency
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Format date
  formatDate(dateString: string): string {
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }

  // Format month name
  formatMonthName(date: Date): string {
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric',
      timeZone: 'UTC'
    });
  }
}

export const controlMasterService = new ControlMasterService(); 