import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GoogleIdentityService } from '../../core/services/google-identity.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-screen">
      <!-- Animated background with gradient and geometric elements -->
      <div class="background-container" aria-hidden="true">
        <div class="gradient-bg"></div>
        <svg class="geometric-shapes" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
          <!-- Large circles with different opacities -->
          <circle cx="150" cy="150" r="200" fill="url(#grad1)" opacity="0.15" />
          <circle cx="850" cy="700" r="300" fill="url(#grad2)" opacity="0.1" />
          <circle cx="900" cy="100" r="150" fill="url(#grad3)" opacity="0.08" />
          
          <!-- Animated grid pattern -->
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#1FC9BA;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#00AEA0;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#3DDC97;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1FC9BA;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#E9BE87;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#CA5215;stop-opacity:1" />
            </linearGradient>
          </defs>
          
          <!-- Grid lines -->
          <g stroke="#1FC9BA" stroke-width="1" opacity="0.06">
            <line x1="0" y1="0" x2="1000" y2="800" />
            <line x1="0" y1="800" x2="1000" y2="0" />
            <line x1="500" y1="0" x2="500" y2="800" />
            <line x1="0" y1="400" x2="1000" y2="400" />
          </g>
          
          <!-- Floating nodes -->
          <circle cx="200" cy="200" r="4" fill="#1FC9BA" opacity="0.3" class="float-node" style="animation: float 6s ease-in-out infinite;" />
          <circle cx="800" cy="300" r="3" fill="#3DDC97" opacity="0.2" class="float-node" style="animation: float 8s ease-in-out infinite 2s;" />
          <circle cx="400" cy="650" r="5" fill="#E9BE87" opacity="0.15" class="float-node" style="animation: float 7s ease-in-out infinite 4s;" />
        </svg>
      </div>

      <div class="login-card enter-scale">
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

        <div #googleButton class="google-btn-container enter-fade-up" style="--stagger-index: 3" *ngIf="googleConfigured"></div>
        <div class="divider enter-fade-up" style="--stagger-index: 3" *ngIf="googleConfigured"><span>ou</span></div>

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

        <p class="switch-link enter-fade-up" style="--stagger-index: 5">
          Pas encore de compte ? <a routerLink="/signup">Créer un compte</a>
        </p>
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

    .background-container {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
    }

    .gradient-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #0D2622 0%, #1a2f2a 50%, #0a1f1c 100%);
      z-index: 0;
    }

    .geometric-shapes {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .float-node {
      filter: drop-shadow(0 0 8px rgba(31, 201, 186, 0.3));
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(20px, -20px); }
      50% { transform: translate(-10px, 30px); }
      75% { transform: translate(-30px, -10px); }
    }

    .login-card {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 380px;
      background: rgba(20, 51, 48, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(31, 201, 186, 0.25);
      border-radius: 16px;
      padding: 34px 30px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      animation: cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes cardEnter {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 26px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(31, 201, 186, 0.15);
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
      filter: drop-shadow(0 0 8px rgba(31, 201, 186, 0.2));
    }

    .brand-fallback {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, #1FC9BA 0%, #00AEA0 100%);
      color: #fff;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 8px 16px rgba(31, 201, 186, 0.25);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .brand-name {
      font-weight: 700;
      font-size: 16.5px;
      color: #fff;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      font-size: 11px;
      color: #1FC9BA;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 600;
    }

    h1 {
      margin: 0 0 4px;
      font-size: 20px;
      color: #fff;
      font-weight: 700;
    }

    .subtitle {
      margin: 0 0 26px;
      font-size: 12.5px;
      color: rgba(255, 255, 255, 0.7);
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
      background: rgba(20, 35, 35, 0.8);
      border: 1px solid rgba(31, 201, 186, 0.15);
      border-radius: 10px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease, background 0.2s ease;
    }

    .field-input-wrap:focus-within {
      border-color: rgba(31, 201, 186, 0.6);
      box-shadow: 0 0 0 3px rgba(31, 201, 186, 0.1), inset 0 0 8px rgba(31, 201, 186, 0.05);
      transform: translateY(-2px);
      background: rgba(30, 45, 45, 0.9);
    }

    .field-input-wrap:hover {
      border-color: rgba(31, 201, 186, 0.3);
      background: rgba(25, 40, 40, 0.85);
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
      color: #fff;
      font-size: 14px;
      font-family: var(--font-ui);
      outline: none;
    }

    input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .field-icon {
      flex-shrink: 0;
      margin-left: 13px;
      color: rgba(255, 255, 255, 0.5);
      transition: color 0.2s ease;
    }

    .field-input-wrap:focus-within .field-icon {
      color: #1FC9BA;
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
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: color 0.15s ease, background 0.15s ease;
    }

    .field-toggle:hover {
      color: #1FC9BA;
      background: rgba(31, 201, 186, 0.1);
    }

    .field-toggle:active {
      transform: scale(0.92);
    }

    .error {
      color: #ff6b6b;
      font-size: 12px;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 20px 0;
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(31, 201, 186, 0.15);
    }

    .switch-link {
      text-align: center;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 16px;
    }

    .switch-link a {
      color: #1FC9BA;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }

    .switch-link a:hover {
      color: #3DDC97;
    }

    button {
      position: relative;
      margin-top: 8px;
      background: linear-gradient(135deg, #1FC9BA 0%, #00AEA0 100%);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 13px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 8px 24px rgba(31, 201, 186, 0.25);
    }

    button:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(31, 201, 186, 0.35);
      background: linear-gradient(135deg, #18b8aa 0%, #008f87 100%);
    }

    button:not(:disabled):active {
      transform: translateY(0);
      box-shadow: 0 4px 12px rgba(31, 201, 186, 0.2);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.is-success:disabled {
      opacity: 1;
      cursor: default;
      background: linear-gradient(135deg, #1FA76B 0%, #15885d 100%);
      box-shadow: 0 8px 24px rgba(31, 167, 107, 0.25);
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

    .google-btn-container {
      display: flex;
      justify-content: center;
      margin-bottom: 4px;
      min-height: 40px;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 12px 0 20px;
      color: var(--text-muted);
      font-size: 12px;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-subtle);
    }

    .switch-link {
      text-align: center;
      margin: 20px 0 0;
      font-size: 13px;
      color: var(--text-muted);
    }

    .switch-link a {
      color: var(--accent-primary);
      font-weight: 600;
      text-decoration: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .login-card, .brand-logo, .btn-spinner, .error, .btn-check {
        animation: none !important;
      }
    }
  `],
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('googleButton') googleButtonRef?: ElementRef<HTMLDivElement>;

  loading = false;
  success = false;
  showPassword = false;
  errorMessage = '';
  googleConfigured = false;
  form;

  /** Vrai seulement si AUCUNE version du logo (claire ou sombre) n'est disponible. */
  logoMissing = false;
  private darkLogoFailed = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly googleIdentity: GoogleIdentityService,
    private readonly router: Router,
    public readonly themeService: ThemeService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.googleConfigured = this.googleIdentity.isConfigured();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.googleConfigured && this.googleButtonRef) {
      this.googleIdentity.renderButton(this.googleButtonRef.nativeElement, (idToken) =>
        this.handleGoogleCredential(idToken)
      );
    }
  }

  ngOnDestroy(): void {}

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
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error || 'Email ou mot de passe incorrect.';
      },
    });
  }

  private handleGoogleCredential(idToken: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle(idToken).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/dashboard']), 550);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error || 'Connexion Google impossible.';
      },
    });
  }
}
