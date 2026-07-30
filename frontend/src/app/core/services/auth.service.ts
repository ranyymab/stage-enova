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
} from '../../shared/models/auth.models';
import { AUTH_CONFIG } from '../config/app-config';

const TOKEN_KEY = 'enova_token';
const USER_KEY = 'enova_user';
const PENDING_EMAIL_KEY = 'enova_pending_verification_email';

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

  // ---------------------------------------------------------------
  // Connexion classique
  // ---------------------------------------------------------------

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(tap((response) => this.persistSession(response)));
  }

  // ---------------------------------------------------------------
  // Inscription + vérification par code envoyé par e-mail
  // ---------------------------------------------------------------

  register(request: RegisterRequest): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.API_URL}/register`, request)
      .pipe(tap(() => this.setPendingVerificationEmail(request.email)));
  }

  verifyEmail(request: VerifyEmailRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/verify-email`, request)
      .pipe(
        tap((response) => {
          this.persistSession(response);
          this.clearPendingVerificationEmail();
        })
      );
  }

  resendCode(request: ResendCodeRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/resend-code`, request);
  }

  getPendingVerificationEmail(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(PENDING_EMAIL_KEY);
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

  // ---------------------------------------------------------------
  // Connexion via Google Sign-In
  // ---------------------------------------------------------------

  loginWithGoogle(idToken: string): Observable<LoginResponse> {
    const request: GoogleLoginRequest = { idToken };
    return this.http
      .post<LoginResponse>(`${this.API_URL}/google`, request)
      .pipe(tap((response) => this.persistSession(response)));
  }

  // ---------------------------------------------------------------

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
