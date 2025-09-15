export interface UserProfile {
  id: number;
  username: string;
  email: string;
  name?: string;
  phone?: string;
  instagram?: string;
  shoppeId?: string;
  shoppeApiPassword?: string;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserUpdateRequest {
  name?: string;
  phone?: string;
  instagram?: string;
  shoppeId?: string;
  shoppeApiPassword?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

export interface UserUpdateResponse {
  user: UserProfile;
}
