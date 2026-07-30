import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GoogleIdentityService } from '../../core/services/google-identity.service';
import { ThemeService } from '../../core/services/theme.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-signup',
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

        <h1>Créer un compte</h1>
        <p class="subtitle">Accès opérateur — un code de vérification vous sera envoyé par e-mail</p>

        <div #googleButton class="google-btn-container" *ngIf="googleConfigured"></div>
        <div class="divider" *ngIf="googleConfigured"><span>ou</span></div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <label class="field">
            <span class="field-label">Nom complet</span>
            <input type="text" formControlName="fullName" placeholder="Jean Dupont" autocomplete="name" />
          </label>

          <label class="field">
            <span class="field-label">Email</span>
            <input type="email" formControlName="email" placeholder="vous&#64;enovarobotics.eu" autocomplete="username" />
          </label>

          <label class="field">
            <span class="field-label">Mot de passe</span>
            <input type="password" formControlName="password" placeholder="••••••••" autocomplete="new-password" />
          </label>
          <p class="hint">8 caractères min., avec majuscule, minuscule, chiffre et caractère spécial.</p>

          <label class="field">
            <span class="field-label">Confirmer le mot de passe</span>
            <input type="password" formControlName="confirmPassword" placeholder="••••••••" autocomplete="new-password" />
          </label>

          <p class="error" *ngIf="form.errors?.['mismatch'] && form.get('confirmPassword')?.touched">
            Les mots de passe ne correspondent pas.
          </p>
          <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
          <p class="success-msg" *ngIf="successMessage">{{ successMessage }}</p>

          <button type="submit" [disabled]="form.invalid || loading">
            <span class="btn-spinner" *ngIf="loading"></span>
            {{ loading ? 'Création...' : 'Créer mon compte' }}
          </button>
        </form>

        <p class="switch-link">Déjà un compte ? <a routerLink="/login">Se connecter</a></p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; min-height: 100vh; }
    .login-screen { min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; background: var(--bg-app); padding: 20px; }
    .login-card { width: 100%; max-width: 400px; background: var(--panel-base); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 34px 30px; box-shadow: 0 20px 50px rgba(0, 60, 55, 0.08); }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
    .brand-logo { width: 44px; height: 44px; object-fit: contain; }
    .brand-fallback { width: 44px; height: 44px; border-radius: 10px; background: var(--accent-primary); color: #fff; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .brand-text { display: flex; flex-direction: column; line-height: 1.2; }
    .brand-name { font-weight: 700; font-size: 16.5px; color: var(--text-primary); }
    .brand-sub { font-size: 11px; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }
    h1 { margin: 0 0 4px; font-size: 20px; color: var(--text-primary); }
    .subtitle { margin: 0 0 20px; font-size: 12.5px; color: var(--text-muted); }
    .google-btn-container { display: flex; justify-content: center; margin-bottom: 12px; min-height: 40px; }
    .divider { display: flex; align-items: center; gap: 10px; margin: 4px 0 18px; color: var(--text-muted); font-size: 12px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border-subtle); }
    form { display: flex; flex-direction: column; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
    input { background: var(--panel-raised); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 11px 13px; color: var(--text-primary); font-size: 14px; outline: none; }
    input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-primary-soft); }
    .hint { margin: -8px 0 0; font-size: 11.5px; color: var(--text-muted); }
    .error { margin: 0; font-size: 12.5px; color: var(--accent-critical); background: rgba(229, 72, 77, 0.1); padding: 8px 10px; border-radius: 6px; }
    .success-msg { margin: 0; font-size: 12.5px; color: #1FA76B; background: rgba(31, 167, 107, 0.1); padding: 8px 10px; border-radius: 6px; }
    button { margin-top: 6px; background: var(--accent-primary); color: #fff; border: none; border-radius: 8px; padding: 12px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .switch-link { text-align: center; margin: 18px 0 0; font-size: 13px; color: var(--text-muted); }
    .switch-link a { color: var(--accent-primary); font-weight: 600; text-decoration: none; }
  `],
})
export class SignupComponent implements AfterViewInit {
  @ViewChild('googleButton') googleButtonRef?: ElementRef<HTMLDivElement>;

  loading = false;
  errorMessage = '';
  successMessage = '';
  logoMissing = false;
  private darkLogoFailed = false;
  googleConfigured = false;

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly googleIdentity: GoogleIdentityService,
    private readonly router: Router,
    public readonly themeService: ThemeService
  ) {
    this.form = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/),
        ]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator }
    );

    this.googleConfigured = this.googleIdentity.isConfigured();
  }

  ngAfterViewInit(): void {
    if (this.googleConfigured && this.googleButtonRef) {
      this.googleIdentity.renderButton(this.googleButtonRef.nativeElement, (idToken) =>
        this.handleGoogleCredential(idToken)
      );
    }
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
    this.successMessage = '';

    const { email, fullName, password } = this.form.value;

    this.authService.register({ email: email!, fullName: fullName!, password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/verify-email'], { queryParams: { email } });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error || "Impossible de créer le compte. Réessayez.";
      },
    });
  }

  private handleGoogleCredential(idToken: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle(idToken).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error || 'Connexion Google impossible.';
      },
    });
  }
}
