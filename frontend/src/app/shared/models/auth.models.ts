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
  /** Present only when SMTP isn't configured on the server and the backend
   *  fell back to returning the code directly instead of silently claiming
   *  the e-mail was sent. Never present in a real production deployment. */
  devCode?: string | null;
}

export interface VerificationResponse {
  message: string;
  codeExpirySeconds: number;
  maxAttempts: number;
  attemptsRemaining: number;
  resendCooldownSeconds: number;
  devCode?: string | null;
}

export interface ApiErrorBody {
  error?: string;
  code?: string;
  fields?: Record<string, string>;
  attemptsRemaining?: number;
  timestamp?: string;
}

