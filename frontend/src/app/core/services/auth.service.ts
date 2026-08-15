import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import {
  CurrentUser,
  GoogleLoginRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  ResendCodeRequest,
  VerifyEmailRequest,
  VerificationResponse,
} from '../../shared/models/auth.models';
import { AUTH_CONFIG } from '../config/app-config';

const TOKEN_KEY = 'enova_token';
const USER_KEY = 'enova_user';
const PENDING_EMAIL_KEY = 'enova_pending_verification_email';
const PENDING_DEV_CODE_KEY = 'enova_pending_dev_code';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = AUTH_CONFIG.API_BASE_URL;
  private readonly platformId = inject(PLATFORM_ID);

  currentUser = signal<CurrentUser | null>(null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.currentUser.set(this.readStoredUser());
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(tap((response) => this.persistSession(response)));
  }

  register(request: RegisterRequest): Observable<VerificationResponse> {
    return this.http
      .post<VerificationResponse>(`${this.API_URL}/register`, request)
      .pipe(
        tap((response) => {
          this.setPendingVerificationEmail(request.email);
          this.setPendingDevCode(response.devCode ?? null);
        })
      );
  }

  verifyEmail(request: VerifyEmailRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/verify-email`, request)
      .pipe(
        tap((response) => {
          this.persistSession(response);
          this.clearPendingVerificationEmail();
          this.setPendingDevCode(null);
        })
      );
  }

  resendCode(request: ResendCodeRequest): Observable<VerificationResponse> {
    return this.http
      .post<VerificationResponse>(`${this.API_URL}/resend-code`, request)
      .pipe(tap((response) => this.setPendingDevCode(response.devCode ?? null)));
  }

  getPendingVerificationEmail(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(PENDING_EMAIL_KEY);
  }

  getPendingDevCode(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(PENDING_DEV_CODE_KEY);
  }

  private setPendingDevCode(code: string | null): void {
    if (!this.isBrowser) return;
    if (code) {
      sessionStorage.setItem(PENDING_DEV_CODE_KEY, code);
    } else {
      sessionStorage.removeItem(PENDING_DEV_CODE_KEY);
    }
  }

  private setPendingVerificationEmail(email: string): void {
    if (this.isBrowser) {
      sessionStorage.setItem(PENDING_EMAIL_KEY, email);
    }
  }

  private clearPendingVerificationEmail(): void {
    if (this.isBrowser) {
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
    }
  }

  loginWithGoogle(idToken: string): Observable<LoginResponse> {
    const request: GoogleLoginRequest = { idToken };
    return this.http
      .post<LoginResponse>(`${this.API_URL}/google`, request)
      .pipe(tap((response) => this.persistSession(response)));
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }

    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private persistSession(response: LoginResponse): void {
    const user: CurrentUser = {
      email: response.email,
      fullName: response.fullName,
      role: response.role,
    };

    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    this.currentUser.set(user);
  }

  private readStoredUser(): CurrentUser | null {
    if (!this.isBrowser) {
      return null;
    }

    const raw = localStorage.getItem(USER_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}
