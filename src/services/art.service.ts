export interface ArtCategory {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtImage {
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

export interface Art {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  category: ArtCategory;
  image: ArtImage;
}

export interface ArtResponse {
  data: Art[];
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
  data: ArtCategory[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

class ArtService {
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
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getCategories(): Promise<ArtCategory[]> {
    try {
      const response: CategoryResponse = await this.makeRequest(
        "/api/art-categories?sort=name:ASC"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching art categories:", error);
      throw error;
    }
  }

  async getArts(params: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    search?: string;
  } = {}): Promise<ArtResponse> {
    try {
      const { page = 1, pageSize = 20, categoryId, search } = params;
      
      let url = `/api/arts?populate[0]=category&populate[1]=image&sort=createdAt:DESC&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
      
      if (categoryId && categoryId > 0) {
        url += `&filters[category][id][$in]=${categoryId}`;
      }
      
      if (search && search.trim()) {
        url += `&filters[title][$containsi]=${encodeURIComponent(search.trim())}`;
      }

      const response: ArtResponse = await this.makeRequest(url);
      return response;
    } catch (error) {
      console.error("Error fetching arts:", error);
      throw error;
    }
  }

  async downloadArt(artImage: ArtImage): Promise<void> {
    try {
      const imageUrl = artImage.url.startsWith('http') 
        ? artImage.url 
        : `${this.baseUrl}${artImage.url}`;

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${artImage.name}${artImage.ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading art:", error);
      throw error;
    }
  }

  getOptimizedImageUrl(image: ArtImage, size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'): string {
    const format = image.formats?.[size];
    if (format) {
      return format.url.startsWith('http') ? format.url : `${this.baseUrl}${format.url}`;
    }
    return image.url.startsWith('http') ? image.url : `${this.baseUrl}${image.url}`;
  }
}

export const artService = new ArtService();