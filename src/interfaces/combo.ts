import { Pack } from "./pack";

export interface Combo {
  id: number;
  documentId: string;
  name: string;
  showTitle: boolean;
  packs: Pack[];
}

export interface ComboResponse {
  data: Combo[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
} 