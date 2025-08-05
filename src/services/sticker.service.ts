export interface StickerCategory {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface StickerImage {
  id: number;
  name: string;
  alternativeText?: string;
  caption?: string;
  width: number;
  height: number;
  formats?: {
    thumbnail?: {
      url: string;
      width: number;
      height: number;
    };
    small?: {
      url: string;
      width: number;
      height: number;
    };
    medium?: {
      url: string;
      width: number;
      height: number;
    };
    large?: {
      url: string;
      width: number;
      height: number;
    };
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
}

export interface Sticker {
  id: number;
  title: string;
  description?: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  category: StickerCategory;
  image: StickerImage;
}

export interface StickerResponse {
  data: Sticker[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface CategoryResponse {
  data: StickerCategory[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

class StickerService {
  private baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  private async makeRequest(url: string, options: RequestInit = {}) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = user.jwt;

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getCategories(): Promise<StickerCategory[]> {
    try {
      const response = await this.makeRequest("/api/sticker-categories");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching sticker categories:", error);
      return [];
    }
  }

  async getStickers(params: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    search?: string;
  } = {}): Promise<StickerResponse> {
    const { page = 1, pageSize = 20, categoryId, search } = params;
    
    let url = `/api/stickers?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`;
    
    if (categoryId && categoryId > 0) {
      url += `&filters[category][id][$eq]=${categoryId}`;
    }
    
    if (search) {
      url += `&filters[title][$containsi]=${encodeURIComponent(search)}`;
    }

    return this.makeRequest(url);
  }

  async downloadSticker(stickerImage: StickerImage): Promise<void> {
    try {
      const response = await fetch(stickerImage.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = stickerImage.name || 'sticker.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading sticker:", error);
      throw error;
    }
  }

  getOptimizedImageUrl(image: StickerImage, size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'): string {
    if (image.formats && image.formats[size]) {
      return image.formats[size].url;
    }
    return image.url;
  }
}

export const stickerService = new StickerService(); 