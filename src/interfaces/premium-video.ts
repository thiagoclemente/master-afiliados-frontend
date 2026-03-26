import { Category } from "./category";
import { ImageInterface } from "./image.interface";

export interface PremiumVideoStreamingFile {
  id?: number;
  documentId?: string;
  name?: string;
  ext?: string | null;
  mime?: string | null;
  url: string;
}

export interface PremiumVideoLink {
  id?: number;
  title?: string | null;
  label?: string | null;
  text?: string | null;
  url?: string | null;
  link?: string | null;
}

export interface PremiumVideo {
  id: number;
  documentId: string;
  title: string;
  type: string;
  image?: ImageInterface | null;
  covers?: ImageInterface[] | null;
  shopeeImageProduct?: ImageInterface | null;
  categories?: Category[] | null;
  links?: PremiumVideoLink[] | null;
  videoStreamingFiles?: PremiumVideoStreamingFile[] | null;
  averageClicks?: string | null;
  cpc?: string | null;
  validatedFor?: string | null;
  extraCommission?: boolean | null;
  narrated?: boolean | null;
  owner?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface PremiumVideoResponse {
  data: PremiumVideo[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface PremiumVideoDetailResponse {
  data: PremiumVideo;
}
