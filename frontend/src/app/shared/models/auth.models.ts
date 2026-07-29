export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  fullName: string;
  role: 'ADMINISTRATEUR' | 'OPERATEUR';
  expiresInMs: number;
}

export interface CurrentUser {
  email: string;
  fullName: string;
  role: 'ADMINISTRATEUR' | 'OPERATEUR';
}
