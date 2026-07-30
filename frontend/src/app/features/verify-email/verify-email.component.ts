import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-screen">
      <div class="login-card">
        <div class="brand">
          <img class="brand-logo" [src]="logoSrc()" *ngIf="!logoMissing" (error)="onLogoError()" alt="Enova Robotics" />
          <span class="brand-fallback" *ngIf="logoMissing">EN</span>
          <div class="brand-text">
            <span class="brand-name">Enova Robotics</span>
            <span class="brand-sub">Surveillance</span>
          </div>
        </div>

        <h1>Vérifiez votre e-mail</h1>
        <p class="subtitle" *ngIf="email">
          Un code à 6 chiffres a été envoyé à <strong>{{ email }}</strong>
        </p>
        <p class="subtitle" *ngIf="!email">
          Saisissez l'adresse e-mail utilisée à l'inscription et le code reçu.
        </p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="field" *ngIf="!email">
            <span class="field-label">Email</span>
            <input type="email" formControlName="email" placeholder="vous&#64;enovarobotics.eu" autocomplete="username" />
          </label>

          <label class="field">
            <span class="field-label">Code de vérification</span>
            <input
              type="text"
              inputmode="numeric"
              maxlength="6"
              formControlName="code"
              placeholder="123456"
              class="code-input"
              autocomplete="one-time-code"
            />
          </label>

          <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
          <p class="success-msg" *ngIf="resendMessage">{{ resendMessage }}</p>

          <button type="submit" [disabled]="form.invalid || loading">
            <span class="btn-spinner" *ngIf="loading"></span>
            {{ loading ? 'Vérification...' : 'Vérifier' }}
          </button>
        </form>

        <button
          type="button"
          class="resend-btn"
          [disabled]="resendCooldown > 0 || resending"
          (click)="onResend()"
        >
          {{ resendCooldown > 0 ? 'Renvoyer le code (' + resendCooldown + 's)' : (resending ? 'Envoi...' : 'Renvoyer le code') }}
        </button>

        <p class="switch-link"><a routerLink="/login">Retour à la connexion</a></p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; min-height: 100vh; }
    .login-screen { min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; background: var(--bg-app); padding: 20px; }
    .login-card { width: 100%; max-width: 380px; background: var(--panel-base); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 34px 30px; box-shadow: 0 20px 50px rgba(0, 60, 55, 0.08); }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
    .brand-logo { width: 44px; height: 44px; object-fit: contain; }
    .brand-fallback { width: 44px; height: 44px; border-radius: 10px; background: var(--accent-primary); color: #fff; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .brand-text { display: flex; flex-direction: column; line-height: 1.2; }
    .brand-name { font-weight: 700; font-size: 16.5px; color: var(--text-primary); }
    .brand-sub { font-size: 11px; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }
    h1 { margin: 0 0 4px; font-size: 20px; color: var(--text-primary); }
    .subtitle { margin: 0 0 22px; font-size: 12.5px; color: var(--text-muted); }
    form { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
    input { background: var(--panel-raised); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 11px 13px; color: var(--text-primary); font-size: 14px; outline: none; }
    input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-primary-soft); }
    .code-input { letter-spacing: 8px; font-size: 20px; text-align: center; font-weight: 700; }
    .error { margin: 0; font-size: 12.5px; color: var(--accent-critical); background: rgba(229, 72, 77, 0.1); padding: 8px 10px; border-radius: 6px; }
    .success-msg { margin: 0; font-size: 12.5px; color: #1FA76B; background: rgba(31, 167, 107, 0.1); padding: 8px 10px; border-radius: 6px; }
    button[type="submit"] { margin-top: 6px; background: var(--accent-primary); color: #fff; border: none; border-radius: 8px; padding: 12px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .resend-btn { width: 100%; margin-top: 12px; background: transparent; border: 1px solid var(--border-subtle); color: var(--text-secondary); border-radius: 8px; padding: 10px; font-size: 13px; cursor: pointer; }
    .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .switch-link { text-align: center; margin: 18px 0 0; font-size: 13px; }
    .switch-link a { color: var(--accent-primary); font-weight: 600; text-decoration: none; }
  `],
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  loading = false;
  resending = false;
  errorMessage = '';
  resendMessage = '';
  logoMissing = false;
  private darkLogoFailed = false;

  email = '';
  resendCooldown = 0;
  private cooldownTimer?: ReturnType<typeof setInterval>;

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

    this.startCooldown(60);
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  logoSrc(): string {
    if (this.themeService.mode() === 'dark' && !this.darkLogoFailed) {
      return '/assets/enova-logo-dark.png';
    }
    return '/assets/enova-logo.png';
  }

  onLogoError(): void {
    if (this.themeService.mode() === 'dark' && !this.darkLogoFailed) {
      this.darkLogoFailed = true;
      return;
    }
    this.logoMissing = true;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, code } = this.form.value;

    this.authService.verifyEmail({ email: email!, code: code! }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error || 'Code invalide.';
      },
    });
  }

  onResend(): void {
    const email = this.form.value.email;
    if (!email) {
      this.errorMessage = "Renseignez votre e-mail pour recevoir un nouveau code.";
      return;
    }

    this.resending = true;
    this.errorMessage = '';
    this.resendMessage = '';

    this.authService.resendCode({ email }).subscribe({
      next: (res) => {
        this.resending = false;
        this.resendMessage = res.message;
        this.startCooldown(60);
      },
      error: (err) => {
        this.resending = false;
        this.errorMessage = err?.error?.error || 'Impossible de renvoyer le code pour le moment.';
      },
    });
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
