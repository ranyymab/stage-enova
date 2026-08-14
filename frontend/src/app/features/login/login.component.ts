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
      <!-- Left: real fleet photography instead of an illustrated stand-in,
           with a dark gradient scrim for text legibility. -->
      <aside class="visual-pane" aria-hidden="true">
        <img class="visual-photo" src="/assets/robot-hero.jpg" alt="" />
        <div class="visual-scrim"></div>
        <div class="scanlines"></div>

        <figure class="visual-quote">
          <blockquote>&laquo;&nbsp;La technologie a le plus de valeur quand elle rapproche les &eacute;quipes du terrain.&nbsp;&raquo;</blockquote>
          <figcaption>&Eacute;quipe Enova Robotics</figcaption>
        </figure>
      </aside>

      <!-- Right: the actual form -->
      <main class="form-pane">
        <div class="form-shell enter-scale">
          <div class="mobile-brand enter-fade-up" style="--stagger-index: 1">
            <img class="brand-logo" [src]="logoSrc()" *ngIf="!logoMissing" (error)="onLogoError()" alt="Enova Robotics" />
            <span class="brand-fallback" *ngIf="logoMissing">EN</span>
          </div>

          <span class="eyebrow enter-fade-up" style="--stagger-index: 1">Acc&egrave;s op&eacute;rateur</span>
          <h1 class="enter-fade-up" style="--stagger-index: 2">Bon retour</h1>
          <p class="subtitle enter-fade-up" style="--stagger-index: 2">Connectez-vous pour superviser votre flotte en temps r&eacute;el.</p>

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

            <div class="row-between enter-fade-up" style="--stagger-index: 4">
              <label class="remember">
                <input type="checkbox" formControlName="remember" />
                <span class="checkbox-visual" aria-hidden="true">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>
                </span>
                Se souvenir de moi
              </label>
              <a class="forgot-link" routerLink="/forgot-password">Mot de passe oubli&eacute; ?</a>
            </div>

            <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

            <button type="submit" [disabled]="form.invalid || loading || success" class="enter-fade-up" [class.is-success]="success" style="--stagger-index: 5">
              <span class="btn-spinner" *ngIf="loading"></span>
              <svg *ngIf="success" class="btn-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>
              {{ success ? 'Connect&eacute;' : (loading ? 'Connexion...' : 'Se connecter') }}
            </button>
          </form>

          <p class="switch-link enter-fade-up" style="--stagger-index: 5">
            Pas encore de compte ? <a routerLink="/signup">Cr&eacute;er un compte</a>
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; min-height: 100vh; }

    .login-screen {
      min-height: 100vh;
      width: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
      background: #0a1210;
    }

    /* ---------- Visual pane ---------- */

    .visual-pane {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 44px 48px;
      background: #050d0c;
    }

    .visual-photo {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 20% 45%;
    }

    .visual-scrim {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(5, 12, 11, 0.32) 0%, rgba(5, 12, 11, 0.15) 30%, rgba(5, 12, 11, 0.4) 65%, rgba(5, 12, 11, 0.94) 100%),
        linear-gradient(90deg, rgba(5, 12, 11, 0.35) 0%, rgba(5, 12, 11, 0) 40%);
    }

    .scanlines {
      position: absolute;
      inset: 0;
      background-image: repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px);
      pointer-events: none;
    }

    .visual-brand {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .visual-brand .brand-logo { width: 30px; height: 30px; object-fit: contain; }
    .visual-brand .brand-fallback {
      width: 30px; height: 30px; border-radius: 8px;
      background: linear-gradient(135deg, #1FC9BA 0%, #00AEA0 100%);
      color: #fff; font-family: var(--font-mono); font-weight: 700; font-size: 12px;
      display: flex; align-items: center; justify-content: center;
    }

    .visual-brand-name {
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: #EAF6F3;
    }
    .visual-brand-name em { font-style: normal; color: #1FC9BA; margin-left: 6px; }

    .visual-quote {
      position: relative;
      z-index: 2;
      max-width: 380px;
      margin: 0;
    }

    .visual-quote blockquote {
      margin: 0 0 10px;
      font-size: 17px;
      line-height: 1.5;
      font-weight: 500;
      color: #EAF6F3;
    }

    .visual-quote figcaption {
      font-size: 11.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #1FC9BA;
      font-family: var(--font-mono);
    }

    /* ---------- Form pane ---------- */

    .form-pane {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0d1512;
      padding: 32px;
    }

    .form-shell {
      width: 100%;
      max-width: 380px;
      animation: cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes cardEnter {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .mobile-brand { display: none; margin-bottom: 22px; }
    .mobile-brand .brand-logo { width: 40px; height: 40px; object-fit: contain; }
    .mobile-brand .brand-fallback {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #1FC9BA 0%, #00AEA0 100%);
      color: #fff; font-family: var(--font-mono); font-weight: 700; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
    }

    .eyebrow {
      display: block;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #1FC9BA;
      margin-bottom: 12px;
    }

    h1 {
      margin: 0 0 6px;
      font-size: 30px;
      line-height: 1.1;
      color: #fff;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .subtitle {
      margin: 0 0 28px;
      font-size: 13.5px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.62);
    }

    form { display: flex; flex-direction: column; gap: 16px; }

    .field { display: flex; flex-direction: column; gap: 6px; }

    .field-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
    }

    .field-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 10px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .field-input-wrap:focus-within {
      border-color: rgba(31, 201, 186, 0.6);
      box-shadow: 0 0 0 3px rgba(31, 201, 186, 0.12);
      background: rgba(31, 201, 186, 0.05);
    }

    .field-input-wrap:hover { border-color: rgba(255, 255, 255, 0.18); }

    .field-icon {
      flex-shrink: 0;
      margin-left: 13px;
      color: rgba(255, 255, 255, 0.4);
      transition: color 0.2s ease;
    }

    .field-input-wrap:focus-within .field-icon { color: #1FC9BA; }

    input[type='email'], input[type='password'], input[type='text'] {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      padding: 12px 13px;
      color: #fff;
      font-size: 14px;
      font-family: var(--font-ui);
      outline: none;
    }

    input::placeholder { color: rgba(255, 255, 255, 0.35); }

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
      color: rgba(255, 255, 255, 0.45);
      cursor: pointer;
      transition: color 0.15s ease, background 0.15s ease;
    }

    .field-toggle:hover { color: #1FC9BA; background: rgba(31, 201, 186, 0.1); }
    .field-toggle:active { transform: scale(0.92); }

    .row-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: -2px;
    }

    .remember {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      color: rgba(255, 255, 255, 0.65);
      cursor: pointer;
      user-select: none;
    }

    .remember input { position: absolute; opacity: 0; width: 0; height: 0; }

    .checkbox-visual {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: transparent;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }

    .remember input:checked + .checkbox-visual {
      background: #1FC9BA;
      border-color: #1FC9BA;
      color: #05201c;
    }

    .forgot-link {
      font-size: 12.5px;
      color: #1FC9BA;
      text-decoration: none;
      font-weight: 600;
    }
    .forgot-link:hover { text-decoration: underline; }

    .error {
      margin: 0;
      font-size: 12.5px;
      color: #ff6b6b;
      background: rgba(229, 72, 77, 0.1);
      padding: 8px 10px;
      border-radius: 6px;
      animation: fadeInUp 0.3s ease both;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .google-btn-container { display: flex; justify-content: center; margin-bottom: 4px; min-height: 40px; }

    .divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 12px 0 20px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
    }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255, 255, 255, 0.09); }

    button[type='submit'] {
      position: relative;
      margin-top: 6px;
      background: linear-gradient(135deg, #1FC9BA 0%, #00AEA0 100%);
      color: #05201c;
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 10px 26px rgba(31, 201, 186, 0.25);
    }

    button[type='submit']:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 34px rgba(31, 201, 186, 0.35);
    }

    button[type='submit']:not(:disabled):active { transform: translateY(0); }
    button[type='submit']:disabled { opacity: 0.5; cursor: not-allowed; }

    button.is-success:disabled {
      opacity: 1;
      cursor: default;
      background: linear-gradient(135deg, #1FA76B 0%, #15885d 100%);
      color: #fff;
    }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid rgba(5, 32, 28, 0.35);
      border-top-color: #05201c;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .btn-check { animation: checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @keyframes checkPop { from { transform: scale(0) rotate(-45deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }

    .switch-link {
      text-align: center;
      margin: 22px 0 0;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
    }
    .switch-link a { color: #1FC9BA; font-weight: 600; text-decoration: none; }
    .switch-link a:hover { text-decoration: underline; }

    @media (max-width: 900px) {
      .login-screen { grid-template-columns: 1fr; }
      .visual-pane { display: none; }
      .mobile-brand { display: flex; }
      .form-pane { padding: 40px 24px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .form-shell, .btn-spinner, .error, .btn-check {
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
      remember: [true],
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
