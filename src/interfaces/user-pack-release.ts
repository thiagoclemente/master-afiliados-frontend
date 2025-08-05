export interface UserPackRelease {
  id: number;
  documentId: string;
  pack: {
    id: number;
    documentId: string;
  };
  user: {
    id: number;
    documentId: string;
  };
  date: string;
}

export interface UserPackReleaseResponse {
  data: UserPackRelease[];
} 