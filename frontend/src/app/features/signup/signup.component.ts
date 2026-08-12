import { Component, AfterViewInit, ElementRef, ViewChild, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GoogleIdentityService } from '../../core/services/google-identity.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecial = /[^a-zA-Z0-9]/.test(value);
  const isLongEnough = value.length >= 8;

  const isValid = hasLower && hasUpper && hasDigit && hasSpecial && isLongEnough;
  return isValid ? null : { weak: true };
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="signup-screen" [attr.data-theme]="themeService.mode()">
      <!-- Background animation -->
      <div class="animated-bg" aria-hidden="true">
        <div class="floating-orb orb-1"></div>
        <div class="floating-orb orb-2"></div>
        <div class="floating-orb orb-3"></div>
      </div>

      <div class="signup-container">
        <!-- Illustration Section -->
        <div class="illustration-section">
          <div class="illustration-wrapper">
            <svg class="security-icon" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(30, 20)">
                <!-- Shield -->
                <path d="M 70 10 L 120 35 L 120 100 Q 70 150 70 150 Q 70 150 20 100 L 20 35 Z" 
                      fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
                <!-- Checkmark -->
                <path d="M 50 100 L 65 120 L 90 85" fill="none" stroke="currentColor" stroke-width="3" 
                      stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
              </g>
            </svg>
            <h2>Créer votre compte</h2>
            <p>Surveillance sécurisée pour vos robots</p>
          </div>
        </div>

        <!-- Form Section -->
        <div class="form-section">
          <div class="header">
            <h1>Inscription</h1>
            <p class="subtitle">Accès opérateur — un code de vérification vous sera envoyé par e-mail</p>
          </div>

          <!-- Google Sign-Up -->
          <div #googleButton class="google-btn-container" *ngIf="googleConfigured" [@slideDown]></div>
          <div class="divider" *ngIf="googleConfigured" [@slideDown]><span>ou</span></div>

          <!-- Signup Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="signup-form">
            <!-- Full Name -->
            <label class="field">
              <span class="field-label">Nom complet</span>
              <div class="field-input-wrap">
                <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input 
                  type="text" 
                  formControlName="fullName" 
                  placeholder="Jean Dupont" 
                  autocomplete="name"
                  [disabled]="loading"
                />
              </div>
              <span class="field-error" *ngIf="form.get('fullName')?.hasError('required') && form.get('fullName')?.touched">
                Le nom est requis
              </span>
              <span class="field-error" *ngIf="form.get('fullName')?.hasError('minlength') && form.get('fullName')?.touched">
                Minimum 2 caractères
              </span>
            </label>

            <!-- Email -->
            <label class="field">
              <span class="field-label">Adresse e-mail</span>
              <div class="field-input-wrap">
                <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M22 6l-10 7-10-7"></path>
                </svg>
                <input 
                  type="email" 
                  formControlName="email" 
                  placeholder="vous@enovarobotics.eu" 
                  autocomplete="username"
                  [disabled]="loading"
                />
              </div>
              <span class="field-error" *ngIf="form.get('email')?.hasError('required') && form.get('email')?.touched">
                L'e-mail est requis
              </span>
              <span class="field-error" *ngIf="form.get('email')?.hasError('email') && form.get('email')?.touched">
                Format e-mail invalide
              </span>
            </label>

            <!-- Password -->
            <label class="field">
              <span class="field-label">Mot de passe</span>
              <div class="field-input-wrap">
                <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input 
                  type="password" 
                  formControlName="password" 
                  placeholder="••••••••" 
                  autocomplete="new-password"
                  [disabled]="loading"
                />
              </div>

              <!-- Password Strength Indicator -->
              <div class="password-strength" *ngIf="form.get('password')?.value">
                <div class="strength-bar">
                  <div class="strength-fill" [style.width.%]="getPasswordStrength().score * 25" 
                       [style.background-color]="getPasswordStrength().color"></div>
                </div>
                <span class="strength-label" [style.color]="getPasswordStrength().color">
                  {{ getPasswordStrength().label }}
                </span>
              </div>

              <!-- Password Requirements -->
              <div class="password-requirements">
                <div class="requirement" [class.met]="hasPasswordRequirement('lower')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Une lettre minuscule (a-z)</span>
                </div>
                <div class="requirement" [class.met]="hasPasswordRequirement('upper')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Une lettre majuscule (A-Z)</span>
                </div>
                <div class="requirement" [class.met]="hasPasswordRequirement('digit')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Un chiffre (0-9)</span>
                </div>
                <div class="requirement" [class.met]="hasPasswordRequirement('special')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Un caractère spécial (!@#$%^&*)</span>
                </div>
                <div class="requirement" [class.met]="hasPasswordRequirement('length')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>8 caractères minimum</span>
                </div>
              </div>

              <span class="field-error" *ngIf="form.get('password')?.hasError('required') && form.get('password')?.touched">
                Le mot de passe est requis
              </span>
            </label>

            <!-- Confirm Password -->
            <label class="field">
              <span class="field-label">Confirmer le mot de passe</span>
              <div class="field-input-wrap">
                <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input 
                  type="password" 
                  formControlName="confirmPassword" 
                  placeholder="••••••••" 
                  autocomplete="new-password"
                  [disabled]="loading"
                />
              </div>

              <span class="field-error" *ngIf="form.errors?.['mismatch'] && form.get('confirmPassword')?.touched">
                Les mots de passe ne correspondent pas
              </span>
            </label>

            <!-- Error/Success Messages -->
            <div class="messages">
              <p class="error-msg" *ngIf="errorMessage" [@fadeIn]>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                {{ errorMessage }}
              </p>
              <p class="success-msg" *ngIf="successMessage && !errorMessage" [@fadeIn]>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {{ successMessage }}
              </p>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="btn-create"
              [disabled]="form.invalid || loading"
              [class.loading]="loading"
            >
              <span class="btn-content" *ngIf="!loading">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Créer mon compte
              </span>
              <span class="btn-loader" *ngIf="loading">
                <span class="spinner"></span>
                Création en cours...
              </span>
            </button>
          </form>

          <!-- Login Link -->
          <p class="switch-link">
            Déjà un compte ? <a routerLink="/login">Se connecter</a>
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

    .signup-screen {
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
      right: -100px;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 200px;
      height: 200px;
      background: #3DDC97;
      bottom: 10%;
      left: -50px;
      animation-delay: 2s;
    }

    .orb-3 {
      width: 150px;
      height: 150px;
      background: #E9BE87;
      top: 20%;
      left: 5%;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(30px); }
    }

    .signup-container {
      display: flex;
      gap: 50px;
      width: 100%;
      max-width: 1000px;
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

    @media (max-width: 900px) {
      .signup-container {
        flex-direction: column;
        gap: 30px;
        padding: 30px 20px;
      }
    }

    .illustration-section {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 280px;
    }

    .illustration-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
    }

    .security-icon {
      width: 220px;
      height: 220px;
      color: var(--accent-primary);
      animation: pulse 2.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(0.98); }
    }

    .illustration-wrapper h2 {
      margin: 0;
      font-size: 20px;
      color: var(--text-primary);
      font-weight: 700;
    }

    .illustration-wrapper p {
      margin: 0;
      font-size: 13px;
      color: var(--text-muted);
    }

    .form-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow-y: auto;
    }

    /* Custom scrollbar */
    .form-section::-webkit-scrollbar {
      width: 6px;
    }

    .form-section::-webkit-scrollbar-track {
      background: transparent;
    }

    .form-section::-webkit-scrollbar-thumb {
      background: var(--border-subtle);
      border-radius: 3px;
    }

    .form-section::-webkit-scrollbar-thumb:hover {
      background: var(--text-muted);
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

    .google-btn-container {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
      min-height: 40px;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 4px 0 20px;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 500;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-subtle);
    }

    .signup-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
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

    .field-input-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
    }

    .field-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted);
      pointer-events: none;
    }

    input[type="text"],
    input[type="email"],
    input[type="password"] {
      flex: 1;
      background: var(--panel-raised);
      border: 2px solid var(--border-subtle);
      border-radius: 10px;
      padding: 12px 14px 12px 40px;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    input[type="text"]:focus,
    input[type="email"]:focus,
    input[type="password"]:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(31, 201, 186, 0.1);
    }

    input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .field-error {
      font-size: 12px;
      color: var(--accent-critical);
      margin-top: 2px;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .password-strength {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }

    .strength-bar {
      height: 4px;
      background: var(--border-subtle);
      border-radius: 2px;
      overflow: hidden;
    }

    .strength-fill {
      height: 100%;
      border-radius: 2px;
      transition: all 0.3s ease;
    }

    .strength-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .password-requirements {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 6px;
      padding: 8px 10px;
      background: var(--panel-raised);
      border-radius: 8px;
    }

    .requirement {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
      transition: color 0.2s ease;
    }

    .requirement svg {
      flex-shrink: 0;
      color: var(--border-subtle);
      transition: color 0.2s ease;
    }

    .requirement.met {
      color: #1FA76B;
    }

    .requirement.met svg {
      color: #1FA76B;
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

    .btn-create {
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

    .btn-create:hover:not(:disabled) {
      background: #17b5a0;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(31, 201, 186, 0.3);
    }

    .btn-create:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    .switch-link {
      text-align: center;
      margin-top: 18px;
      font-size: 13px;
      color: var(--text-muted);
    }

    .switch-link a {
      color: var(--accent-primary);
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.2s ease;
    }

    .switch-link a:hover {
      opacity: 0.8;
    }
  `],
})
export class SignupComponent implements AfterViewInit, OnDestroy {
  @ViewChild('googleButton') googleButtonRef?: ElementRef<HTMLDivElement>;

  loading = false;
  errorMessage = '';
  successMessage = '';
  googleConfigured = false;

  private readonly destroy$ = new Subject<void>();

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
        password: ['', [Validators.required, passwordStrengthValidator]],
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPasswordStrength(): PasswordStrength {
    const value = this.form.get('password')?.value || '';
    let score = 0;

    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^a-zA-Z0-9]/.test(value)) score++;
    if (value.length >= 8) score++;

    const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'];
    const colors = ['#E54854', '#F2A93B', '#F2D93B', '#8BC34A', '#1FA76B'];

    return {
      score: Math.min(score, 4),
      label: labels[Math.min(score, 4)],
      color: colors[Math.min(score, 4)],
    };
  }

  hasPasswordRequirement(req: 'lower' | 'upper' | 'digit' | 'special' | 'length'): boolean {
    const value = this.form.get('password')?.value || '';
    switch (req) {
      case 'lower': return /[a-z]/.test(value);
      case 'upper': return /[A-Z]/.test(value);
      case 'digit': return /\d/.test(value);
      case 'special': return /[^a-zA-Z0-9]/.test(value);
      case 'length': return value.length >= 8;
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, fullName, password } = this.form.value;

    this.authService.register({ email: email!, fullName: fullName!, password: password! })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Compte créé avec succès ! Redirection...';
          setTimeout(() => {
            this.router.navigate(['/verify-email'], { queryParams: { email } });
          }, 800);
        },
        error: (err) => {
          this.loading = false;
          const errorData = err?.error;
          this.errorMessage = errorData?.error || "Impossible de créer le compte. Réessayez.";
          if (errorData?.fields) {
            const fieldErrors = Object.entries(errorData.fields)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');
            this.errorMessage += '\n' + fieldErrors;
          }
        },
      });
  }

  private handleGoogleCredential(idToken: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle(idToken)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
