import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-screen">
      <div class="aurora aurora-1"></div>
      <div class="aurora aurora-2"></div>
      <div class="aurora aurora-3"></div>
      <div class="grid-overlay"></div>

      <div class="login-card enter-scale">
        <div class="scan-line"></div>
        <div class="status-strip">
          <span class="status-dot"></span>
          <span>Systeme en ligne</span>
          <span class="status-sep">·</span>
          <span class="mono">{{ liveClock }}</span>
        </div>

        <div class="brand enter-fade-up" style="--stagger-index: 1">
          <img class="brand-logo" [src]="logoSrc()" *ngIf="!logoMissing"
               (error)="onLogoError()" alt="Enova Robotics" />
          <span class="brand-fallback" *ngIf="logoMissing">EN</span>
          <div class="brand-text">
            <span class="brand-name">Enova Robotics</span>
            <span class="brand-sub">Surveillance</span>
          </div>
        </div>

        <h1 class="enter-fade-up" style="--stagger-index: 2">Connexion</h1>
        <p class="subtitle enter-fade-up" style="--stagger-index: 2">Surveillance ROBOT-001 · accès opérateur / administrateur</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="field enter-fade-up" style="--stagger-index: 3">
            <span class="field-label">Email</span>
            <div class="field-input-wrap">
              <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2.2"/><path d="M3 6.5l9 6.5 9-6.5"/></svg>
              <input
                type="email"
                formControlName="email"
                placeholder="vous&#64;enovarobotics.eu"
                autocomplete="username"
              />
            </div>
          </label>

          <label class="field enter-fade-up" style="--stagger-index: 4">
            <span class="field-label">Mot de passe</span>
            <div class="field-input-wrap">
              <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <button type="button" class="field-toggle" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                <svg *ngIf="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg *ngIf="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.1 4.1M6.5 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 3.4-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
              </button>
            </div>
          </label>

          <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

          <button type="submit" [disabled]="form.invalid || loading || success" class="enter-fade-up" [class.is-success]="success" style="--stagger-index: 5">
            <span class="btn-spinner" *ngIf="loading"></span>
            <svg *ngIf="success" class="btn-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>
            {{ success ? 'Connecte' : (loading ? 'Connexion...' : 'Se connecter') }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }

    .login-screen {
      position: relative;
      min-height: 100vh;
      width: 100%;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-app);
      padding: 20px;
      overflow: hidden;
    }

    .aurora {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.35;
      pointer-events: none;
      animation: auroraDrift 14s ease-in-out infinite;
    }

    .aurora-1 { width: 460px; height: 460px; background: var(--brand-primary, var(--accent-primary)); top: -140px; left: -120px; animation-delay: 0s; }
    .aurora-2 { width: 380px; height: 380px; background: var(--brand-secondary, #E9BE87); bottom: -140px; right: -100px; animation-delay: -4s; }
    .aurora-3 { width: 320px; height: 320px; background: var(--brand-accent, #CA5215); bottom: 10%; left: 8%; opacity: 0.18; animation-delay: -8s; }

    @keyframes auroraDrift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(30px, -20px) scale(1.08); }
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(color-mix(in srgb, var(--border-subtle) 60%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in srgb, var(--border-subtle) 60%, transparent) 1px, transparent 1px);
      background-size: 42px 42px;
      mask-image: radial-gradient(ellipse 70% 70% at center, black 30%, transparent 80%);
      pointer-events: none;
    }

    .login-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 380px;
      background: color-mix(in srgb, var(--panel-base) 92%, transparent);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 34px 30px;
      box-shadow: 0 20px 50px rgba(0, 60, 55, 0.12), 0 0 0 1px rgba(0, 174, 160, 0.04);
      animation: cardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
      overflow: hidden;
    }

    .scan-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      top: 0;
      background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
      opacity: 0.8;
      animation: scanSweep 2.4s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both;
      pointer-events: none;
    }

    @keyframes scanSweep {
      0% { top: 0; opacity: 0; }
      8% { opacity: 1; }
      92% { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }

    .status-strip {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 10.5px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 20px;
    }

    .status-strip .mono {
      font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
      margin-left: auto;
      letter-spacing: 0;
      text-transform: none;
    }

    .status-sep { opacity: 0.4; }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-active, var(--accent-primary));
      box-shadow: 0 0 0 0 rgba(0, 174, 160, 0.5);
      animation: statusPulse 1.8s ease-in-out infinite;
    }

    @keyframes statusPulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 174, 160, 0.5); }
      70% { box-shadow: 0 0 0 6px rgba(0, 174, 160, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 174, 160, 0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .scan-line, .status-dot { animation: none; }
    }

    @keyframes cardEnter {
      from { opacity: 0; transform: translateY(18px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 26px;
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(0, 174, 160, 0.3));
      animation: logoPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      animation-delay: 0.15s;
    }

    @keyframes logoPop {
      from { opacity: 0; transform: scale(0.6) rotate(-8deg); }
      to { opacity: 1; transform: scale(1) rotate(0); }
    }

    .brand-fallback {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(150deg, var(--brand-primary, var(--accent-primary)), #00857c);
      color: #fff;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      animation: logoPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      animation-delay: 0.15s;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .brand-name {
      font-weight: 700;
      font-size: 16.5px;
      color: var(--text-primary);
    }

    .brand-sub {
      font-size: 11px;
      color: var(--accent-primary);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 600;
    }

    h1 {
      margin: 0 0 4px;
      font-size: 20px;
      color: var(--text-primary);
    }

    .subtitle {
      margin: 0 0 26px;
      font-size: 12.5px;
      color: var(--text-muted);
    }

    form {
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
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .field-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--panel-raised);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
    }

    .field-input-wrap:focus-within {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-primary-soft);
      transform: translateY(-1px);
    }

    .field-input-wrap:hover {
      border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-subtle));
    }

    .field-icon {
      flex-shrink: 0;
      margin-left: 13px;
      color: var(--text-muted);
      transition: color 0.2s ease;
    }

    .field-input-wrap:focus-within .field-icon {
      color: var(--accent-primary);
    }

    input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      border-radius: 8px;
      padding: 11px 13px;
      color: var(--text-primary);
      font-size: 14px;
      font-family: var(--font-ui);
      outline: none;
    }

    .field-toggle {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      margin: 0 4px 0 0;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;
    }

    .field-toggle:hover {
      color: var(--accent-primary);
      background: var(--accent-primary-soft);
    }

    .field-toggle:active {
      transform: scale(0.9);
    }

    button {
      position: relative;
      margin-top: 8px;
      background: linear-gradient(120deg, var(--brand-primary, var(--accent-primary)), color-mix(in srgb, var(--brand-primary, var(--accent-primary)) 70%, #00E0C6));
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      overflow: hidden;
      transition: transform 0.15s ease, box-shadow 0.25s ease, opacity 0.15s ease;
      box-shadow: 0 6px 18px color-mix(in srgb, var(--accent-primary) 30%, transparent);
    }

    button:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px color-mix(in srgb, var(--accent-primary) 40%, transparent);
    }

    button:not(:disabled):active {
      transform: translateY(0) scale(0.98);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    button.is-success:disabled {
      opacity: 1;
      cursor: default;
      background: linear-gradient(120deg, #00AEA0, #3FD6C4);
    }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-check {
      animation: checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes checkPop {
      from { transform: scale(0) rotate(-45deg); opacity: 0; }
      to { transform: scale(1) rotate(0); opacity: 1; }
    }

    .error {
      margin: 0;
      font-size: 12.5px;
      color: var(--accent-critical);
      background: rgba(229, 72, 77, 0.1);
      padding: 8px 10px;
      border-radius: 6px;
      animation: fadeInUp 0.3s ease both;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .aurora, .login-card, .brand-logo, .btn-spinner, .error, .btn-check, .scan-line, .status-dot {
        animation: none !important;
      }
    }
  `],
})
export class LoginComponent implements OnInit, OnDestroy {
  loading = false;
  success = false;
  showPassword = false;
  errorMessage = '';
  form;
  liveClock = '';
  private clockInterval: any = null;

  /** Vrai seulement si AUCUNE version du logo (claire ou sombre) n'est disponible. */
  logoMissing = false;
  private darkLogoFailed = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    public readonly themeService: ThemeService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private updateClock(): void {
    this.liveClock = new Date().toLocaleTimeString('fr-FR');
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

    const { email, password } = this.form.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/dashboard']), 550);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Email ou mot de passe incorrect.';
      },
    });
  }
}
