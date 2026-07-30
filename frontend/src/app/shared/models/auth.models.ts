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

export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface MessageResponse {
  message: string;
}

export interface ApiErrorBody {
  error?: string;
  fields?: Record<string, string>;
}
