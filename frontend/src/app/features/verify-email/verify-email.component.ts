import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface VerificationState {
  codeExpirySeconds: number;
  maxAttempts: number;
  attemptsRemaining: number;
  resendCooldownSeconds: number;
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="verify-screen" [attr.data-theme]="themeService.mode()">
      <!-- Background animation -->
      <div class="animated-bg" aria-hidden="true">
        <div class="floating-orb orb-1"></div>
        <div class="floating-orb orb-2"></div>
        <div class="floating-orb orb-3"></div>
      </div>

      <div class="verify-container">
        <!-- Illustration Section -->
        <div class="illustration-section">
          <div class="illustration-wrapper">
            <svg class="envelope-icon" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(50, 40)">
                <!-- Envelope body -->
                <rect x="0" y="0" width="100" height="80" fill="none" stroke="currentColor" stroke-width="2" rx="4"/>
                <!-- Flap -->
                <path d="M 0 0 L 50 40 L 100 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- Letter inside -->
                <rect x="10" y="20" width="80" height="50" fill="none" stroke="currentColor" stroke-width="1.5" rx="2" opacity="0.6"/>
                <!-- Checkmark (appears on success) -->
                <g *ngIf="verificationSuccess" class="checkmark-animate">
                  <circle cx="120" cy="20" r="18" fill="currentColor" opacity="0.2"/>
                  <path d="M 115 20 L 120 26 L 128 15" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
              </g>
            </svg>
            <p class="illustration-text" *ngIf="!verificationSuccess">Verifying...</p>
            <p class="illustration-text success" *ngIf="verificationSuccess">Email verified!</p>
          </div>
        </div>

        <!-- Form Section -->
        <div class="form-section">
          <div class="header">
            <h1>Verify your email</h1>
            <p class="subtitle" *ngIf="email && !devCode">
              A 6-digit code has been sent to <strong>{{ email }}</strong>
            </p>
            <p class="subtitle" *ngIf="!email">
              Enter the email address used at sign-up.
            </p>
          </div>

          <!-- Dev Mode Banner -->
          <div class="dev-banner" *ngIf="devCode" [@slideDown]>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>Development mode</strong>
              <p>No email was sent. Here is your test code, pre-filled below.</p>
            </div>
          </div>

          <!-- Verification State Info -->
          <div class="verification-info" *ngIf="verificationState$ | async as state">
            <div class="info-row">
              <span class="info-label">Code expires in:</span>
              <span class="info-value" [class.warning]="state.codeExpirySeconds < 60">
                {{ formatExpiryTime(state.codeExpirySeconds) }}
              </span>
            </div>
            <div class="info-row" *ngIf="state.attemptsRemaining < state.maxAttempts">
              <span class="info-label">Tentatives restantes:</span>
              <span class="info-value" [class.critical]="state.attemptsRemaining <= 1">
                {{ state.attemptsRemaining }}/{{ state.maxAttempts }}
              </span>
            </div>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="verification-form">
            <label class="field" *ngIf="!email">
              <span class="field-label">Adresse e-mail</span>
              <input 
                type="email" 
                formControlName="email" 
                placeholder="vous@enovarobotics.eu" 
                autocomplete="username"
                [disabled]="loading"
              />
              <span class="field-error" *ngIf="form.get('email')?.hasError('email') && form.get('email')?.touched">
                Email invalide
              </span>
            </label>

            <div class="code-field">
              <label class="field">
                <span class="field-label">Verification code</span>
                <div class="code-input-wrapper">
                  <input
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    formControlName="code"
                    placeholder="000000"
                    class="code-input"
                    autocomplete="one-time-code"
                    [disabled]="loading"
                    (input)="onCodeInput($event)"
                  />
                  <div class="code-length-indicator">
                    <span class="dot" *ngFor="let i of [1,2,3,4,5,6]" 
                          [class.filled]="form.get('code')?.value?.length! >= i"></span>
                  </div>
                </div>
              </label>
            </div>

            <div class="messages">
              <p class="error-msg" *ngIf="errorMessage" [@fadeIn]>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <text x="12" y="16" text-anchor="middle" fill="white" font-size="14" font-weight="bold">!</text>
                </svg>
                {{ errorMessage }}
              </p>
              <p class="success-msg" *ngIf="resendMessage && !errorMessage" [@fadeIn]>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {{ resendMessage }}
              </p>
            </div>

            <button 
              type="submit" 
              class="btn-verify"
              [disabled]="form.invalid || loading"
              [class.loading]="loading"
            >
              <span class="btn-content" *ngIf="!loading">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Verify
              </span>
              <span class="btn-loader" *ngIf="loading">
                <span class="spinner"></span>
                Verifying...
              </span>
            </button>
          </form>

          <!-- Resend Code Section -->
          <div class="resend-section">
            <button
              type="button"
              class="btn-resend"
              [disabled]="resendCooldown > 0 || resending"
              (click)="onResend()"
            >
              <svg *ngIf="resendCooldown === 0 && !resending" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2-8.83"></path>
              </svg>
              <span class="spinner-mini" *ngIf="resending"></span>
              <span class="resend-text">
                {{ resendCooldown > 0 ? 'Resend in ' + resendCooldown + 's' : (resending ? 'Sending...' : 'Resend code') }}
              </span>
            </button>
          </div>

          <!-- Back Link -->
          <p class="back-link">
            <a routerLink="/login" [queryParams]="{}">&#8592; Back to sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }

    .verify-screen {
      min-height: 100vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--bg-app) 0%, var(--panel-raised) 100%);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .animated-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      opacity: 0.3;
      pointer-events: none;
    }

    .floating-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      animation: float 8s ease-in-out infinite;
    }

    .orb-1 {
      width: 300px;
      height: 300px;
      background: var(--accent-primary);
      top: -100px;
      left: -100px;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 200px;
      height: 200px;
      background: #3DDC97;
      bottom: -50px;
      right: -50px;
      animation-delay: 2s;
    }

    .orb-3 {
      width: 150px;
      height: 150px;
      background: #E9BE87;
      top: 50%;
      right: 10%;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(30px); }
    }

    .verify-container {
      display: flex;
      gap: 40px;
      width: 100%;
      max-width: 900px;
      background: var(--panel-base);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 60, 55, 0.12);
      position: relative;
      z-index: 1;
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .verify-container {
        flex-direction: column;
        gap: 30px;
        padding: 30px 20px;
      }
    }

    .illustration-section {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 250px;
    }

    .illustration-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
    }

    .envelope-icon {
      width: 200px;
      height: 200px;
      color: var(--accent-primary);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .checkmark-animate {
      animation: checkmarkPop 0.6s ease-out;
    }

    @keyframes checkmarkPop {
      0% {
        opacity: 0;
        transform: scale(0.5);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .illustration-text {
      font-size: 14px;
      color: var(--text-muted);
      margin: 0;
      font-weight: 500;
    }

    .illustration-text.success {
      color: #1FA76B;
      font-weight: 600;
    }

    .form-section {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .header {
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0 0 8px;
      font-size: 28px;
      color: var(--text-primary);
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .subtitle strong {
      color: var(--text-primary);
      font-weight: 600;
    }

    .dev-banner {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      padding: 12px 14px;
      background: rgba(242, 169, 59, 0.1);
      border: 1px solid rgba(242, 169, 59, 0.3);
      border-radius: 10px;
      color: #92620A;
      font-size: 13px;
      line-height: 1.5;
    }

    .dev-banner svg {
      flex-shrink: 0;
      color: #F2A93B;
    }

    .dev-banner strong {
      display: block;
      margin-bottom: 2px;
    }

    .dev-banner p {
      margin: 0;
    }

    :root[data-theme='dark'] .dev-banner {
      color: #F2A93B;
      background: rgba(242, 169, 59, 0.15);
    }

    .verification-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
      padding: 12px;
      background: var(--panel-raised);
      border-radius: 8px;
      font-size: 13px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-label {
      color: var(--text-muted);
      font-weight: 500;
    }

    .info-value {
      color: var(--text-primary);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .info-value.warning {
      color: #F2A93B;
    }

    .info-value.critical {
      color: var(--accent-critical);
    }

    .verification-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input[type="email"],
    input[type="text"] {
      background: var(--panel-raised);
      border: 2px solid var(--border-subtle);
      border-radius: 10px;
      padding: 12px 14px;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    input[type="email"]:focus,
    input[type="text"]:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(31, 201, 186, 0.1);
    }

    input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .code-field {
      position: relative;
    }

    .code-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .code-input {
      letter-spacing: 12px !important;
      font-size: 28px !important;
      text-align: center;
      font-weight: 700;
      font-family: 'Monaco', 'Courier New', monospace !important;
    }

    .code-length-indicator {
      display: flex;
      gap: 6px;
      justify-content: center;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--border-subtle);
      transition: all 0.2s ease;
    }

    .dot.filled {
      background: var(--accent-primary);
      transform: scale(1.2);
    }

    .messages {
      min-height: 40px;
      display: flex;
      flex-direction: column;
    }

    .error-msg,
    .success-msg {
      margin: 0;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      line-height: 1.4;
    }

    .error-msg {
      color: var(--accent-critical);
      background: rgba(229, 72, 77, 0.1);
    }

    .success-msg {
      color: #1FA76B;
      background: rgba(31, 167, 107, 0.1);
    }

    .btn-verify {
      background: var(--accent-primary);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 14px 20px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      margin-top: 4px;
    }

    .btn-verify:hover:not(:disabled) {
      background: #17b5a0;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(31, 201, 186, 0.3);
    }

    .btn-verify:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-verify.loading {
      background: var(--accent-primary);
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-loader {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .resend-section {
      margin-top: 12px;
      text-align: center;
    }

    .btn-resend {
      background: transparent;
      border: 2px solid var(--border-subtle);
      color: var(--text-secondary);
      border-radius: 10px;
      padding: 12px 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .btn-resend:hover:not(:disabled) {
      border-color: var(--accent-primary);
      color: var(--accent-primary);
      background: rgba(31, 201, 186, 0.05);
    }

    .btn-resend:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner-mini {
      width: 12px;
      height: 12px;
      border: 2px solid var(--border-subtle);
      border-top-color: var(--text-secondary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .resend-text {
      font-variant-numeric: tabular-nums;
    }

    .back-link {
      text-align: center;
      margin-top: 18px;
      font-size: 13px;
    }

    .back-link a {
      color: var(--accent-primary);
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.2s ease;
    }

    .back-link a:hover {
      opacity: 0.8;
    }
  `],
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  loading = false;
  resending = false;
  errorMessage = '';
  resendMessage = '';
  verificationSuccess = false;

  email = '';
  devCode: string | null = null;
  resendCooldown = 0;
  
  private readonly destroy$ = new Subject<void>();
  private cooldownTimer?: ReturnType<typeof setInterval>;
  verificationState$ = new Subject<VerificationState>();

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    public readonly themeService: ThemeService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  ngOnInit(): void {
    const fromQuery = this.route.snapshot.queryParamMap.get('email');
    const pending = this.authService.getPendingVerificationEmail();
    this.email = fromQuery || pending || '';

    if (this.email) {
      this.form.patchValue({ email: this.email });
    }

    this.devCode = this.authService.getPendingDevCode();
    if (this.devCode) {
      this.form.patchValue({ code: this.devCode });
    }

    this.startExpiryTimer();
    this.startCooldown(60);
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Auto-submit if 6 digits entered
    if (input.value.length === 6 && this.form.valid) {
      setTimeout(() => this.onSubmit(), 100);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.resendMessage = '';

    const { email, code } = this.form.value;

    this.authService.verifyEmail({ email: email!, code: code! })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.verificationSuccess = true;
          setTimeout(() => this.router.navigate(['/dashboard']), 800);
        },
        error: (err) => {
          this.loading = false;
          const errorData = err?.error;
          if (errorData?.attemptsRemaining !== undefined) {
            const remaining = errorData.attemptsRemaining;
            this.errorMessage = `${errorData.error || 'Invalid code.'} (${remaining} attempt${remaining > 1 ? 's' : ''} remaining)`;
          } else {
            this.errorMessage = errorData?.error || 'Error during verification.';
          }
        },
      });
  }

  onResend(): void {
    const email = this.form.value.email;
    if (!email) {
      this.errorMessage = "Renseignez votre e-mail.";
      return;
    }

    this.resending = true;
    this.errorMessage = '';
    this.resendMessage = '';

    this.authService.resendCode({ email })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.resending = false;
          this.resendMessage = res.message;
          this.devCode = res.devCode ?? null;
          if (this.devCode) {
            this.form.patchValue({ code: this.devCode });
          }
          if (res.codeExpirySeconds) {
            this.startExpiryTimer(res.codeExpirySeconds);
          }
          this.startCooldown(res.resendCooldownSeconds || 60);
        },
        error: (err) => {
          this.resending = false;
          this.errorMessage = err?.error?.error || 'Unable to resend code.';
        },
      });
  }

  formatExpiryTime(seconds: number): string {
    if (seconds <= 0) return 'Expired';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  private startExpiryTimer(initialSeconds?: number): void {
    const startSeconds = initialSeconds || 600; // 10 minutes default
    const startTime = Date.now();
    
    const updateState = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, startSeconds - elapsed);
      
      this.verificationState$.next({
        codeExpirySeconds: remaining,
        maxAttempts: 5,
        attemptsRemaining: 5,
        resendCooldownSeconds: this.resendCooldown,
      });

      if (remaining > 0) {
        requestAnimationFrame(updateState);
      } else {
        this.errorMessage = 'The code has expired. Please request a new one.';
      }
    };
    
    updateState();
  }

  private startCooldown(seconds: number): void {
    this.resendCooldown = seconds;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown = Math.max(0, this.resendCooldown - 1);
      if (this.resendCooldown === 0 && this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
      }
    }, 1000);
  }
}

