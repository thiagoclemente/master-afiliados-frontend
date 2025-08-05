import { ImageInterface } from "./image.interface";

export interface Pack {
  id: number;
  documentId: string;
  name: string;
  description: string;
  image: ImageInterface;
  link: string;
  availableForDownload: boolean;
  showCategories: boolean;
  isFree: boolean;
  packStart: boolean;
  message?: string;
  createdAt: string;
  order: number;
  appleProductId?: string;
  googleProductId?: string;
  price: string;
  officialPackage?: PackInitialOrOfficial;
  initialPackage?: PackInitialOrOfficial;
  isSubscription: boolean;
}

export interface PackInitialOrOfficial {
  id: number;
  documentId: string;
}