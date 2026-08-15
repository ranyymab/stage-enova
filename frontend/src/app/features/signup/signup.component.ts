import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

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

interface PasswordCheck {
  length: boolean;
  upper: boolean;
  number: boolean;
}

@Component({
  selector: 'app-signup',

  standalone: true,

  imports: [CommonModule, ReactiveFormsModule, RouterLink],

  template: `

    <div class="auth-screen" [class.light-mode]="!darkMode">

      <aside class="visual-pane">

        <img class="visual-photo" src="/assets/robot-hero.png" alt="Enova Robotics autonomous robot" />

        <div class="visual-scrim"></div>

        <div class="scanlines"></div>

        <div class="visual-glow"></div>

        <div class="visual-brand">

          <div class="brand-category">
            <span class="brand-line"></span>
            <span>AUTONOMOUS ROBOTICS</span>
          </div>

          <div class="brand-name">ENOVA</div>

          <div class="brand-name-sub">ROBOTICS</div>

          <div class="brand-description">
            <span class="description-line"></span>
            <span>INTELLIGENCE IN MOTION</span>
          </div>

        </div>

      </aside>

      <main class="form-pane">

        <div class="form-shell">

          <button
            type="button"
            class="theme-toggle"
            (click)="toggleTheme()"
            [attr.aria-label]="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <span class="theme-icon" aria-hidden="true">{{ darkMode ? '☀' : '☾' }}</span>
            <span class="theme-label">{{ darkMode ? 'LIGHT' : 'DARK' }}</span>
          </button>

          <div class="mobile-brand">
            <div class="mobile-brand-name">ENOVA</div>
            <div class="mobile-brand-sub">ROBOTICS</div>
          </div>

          <section class="auth-view">

            <button type="button" class="back-button" routerLink="/login">
              <span aria-hidden="true">&#8592;</span>
              Back to login
            </button>

            <div class="eyebrow">
              <span></span>
              OPERATOR REGISTRATION
            </div>

            <h1>Create <strong>account</strong></h1>

            <p class="subtitle">Set up your operator credentials.</p>

            <div #googleButton class="google-btn-container" *ngIf="googleConfigured"></div>

            <div class="divider" *ngIf="googleConfigured"><span>OR</span></div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

              <label class="field">
                <span class="field-label">OPERATOR NAME</span>
                <div class="field-input-wrap">
                  <svg class="field-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    formControlName="fullName"
                    placeholder="Operator name"
                    autocomplete="name"
                    [disabled]="loading"
                  />
                </div>
              </label>

              <label class="field">
                <span class="field-label">OPERATOR EMAIL</span>
                <div class="field-input-wrap">
                  <svg class="field-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2.5" y="4.5" width="19" height="15" rx="2.2" />
                    <path d="M3 6.5l9 6.5 9-6.5" />
                  </svg>
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="operator@enovarobotics.eu"
                    autocomplete="username"
                    spellcheck="false"
                    [disabled]="loading"
                  />
                </div>
              </label>

              <label class="field">
                <span class="field-label">ACCESS KEY</span>
                <div class="field-input-wrap">
                  <svg class="field-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
                    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
                  </svg>
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="Create a secure key"
                    autocomplete="new-password"
                    [disabled]="loading"
                  />
                  <button
                    type="button"
                    class="field-toggle"
                    (click)="showPassword = !showPassword"
                    [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                  >
                    <svg *ngIf="!showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg *ngIf="showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7" />
                      <path d="M6.5 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 3.4-.6" />
                    </svg>
                  </button>
                </div>
              </label>

              <label class="field">
                <span class="field-label">CONFIRM ACCESS KEY</span>
                <div class="field-input-wrap">
                  <svg class="field-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
                    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
                  </svg>
                  <input
                    [type]="showConfirmPassword ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    placeholder="Repeat access key"
                    autocomplete="new-password"
                    [disabled]="loading"
                  />
                  <button
                    type="button"
                    class="field-toggle"
                    (click)="showConfirmPassword = !showConfirmPassword"
                    [attr.aria-label]="showConfirmPassword ? 'Hide password' : 'Show password'"
                  >
                    <svg *ngIf="!showConfirmPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg *ngIf="showConfirmPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7" />
                      <path d="M6.5 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 3.4-.6" />
                    </svg>
                  </button>
                </div>
                <span class="field-error" *ngIf="form.errors?.['mismatch'] && form.get('confirmPassword')?.touched">
                  Access keys do not match
                </span>
              </label>

              <div class="requirement-pills">
                <span class="req-pill" [class.met]="passwordChecks().length">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6" /></svg>
                  8+ characters
                </span>
                <span class="req-pill" [class.met]="passwordChecks().upper">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6" /></svg>
                  Uppercase
                </span>
                <span class="req-pill" [class.met]="passwordChecks().number">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6" /></svg>
                  Number
                </span>
              </div>

              <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

              <button
                type="submit"
                class="primary-button"
                [class.success]="signupSuccess"
                [disabled]="form.invalid || loading || signupSuccess"
              >
                <span class="btn-spinner" *ngIf="loading"></span>

                <svg *ngIf="signupSuccess" class="btn-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12l6 6L20 6" />
                </svg>

                <span>
                  {{ signupSuccess ? 'ACCOUNT READY' : (loading ? 'CREATING ACCESS...' : 'CREATE OPERATOR ACCESS') }}
                </span>

                <span *ngIf="!loading && !signupSuccess" class="button-arrow">&#8594;</span>
              </button>

            </form>

            <p class="switch-link">
              Already an operator?
              <button type="button" routerLink="/login">Sign in</button>
            </p>

          </section>

        </div>

      </main>

    </div>
  `,

  styles: [`


    /* =============================================================
       BASE
       ============================================================= */

    :host {

      display: block;

      width: 100%;

      min-height: 100vh;

      --blue: #1764A3;

      --blue-dark: #0B3155;

      --bg: #030912;

      --panel: #071321;

      --text: #EAF2FA;

      --muted: rgba(220,232,245,.58);

      --line: rgba(120,165,205,.14);

    }

    * {
      box-sizing: border-box;
    }

    /* =============================================================
       SCREEN
       ============================================================= */

    .auth-screen {

      width: 100%;

      min-height: 100vh;

      display: grid;

      grid-template-columns:
        minmax(0, 1fr)
        minmax(520px, 1fr);

      background: var(--bg);

      overflow: hidden;

      transition:
        background .35s ease;

    }

    /* =============================================================
       LEFT IMAGE
       ============================================================= */

    .visual-pane {

      position: relative;

      min-height: 100vh;

      overflow: hidden;

      background: #02060c;

    }

    .visual-photo {

      position: absolute;

      inset: 0;

      width: 100%;

      height: 100%;

      object-fit: cover;

      object-position: 38% center;

      /*
       * IMPORTANT:
       * The old brightness(.62) was making the robot way too dark.
       */

      filter:
        saturate(.90)
        contrast(1.04)
        brightness(.96);

      transform: scale(1.015);

      transition:
        filter .35s ease;

    }

    /* =============================================================
       IMAGE SCRIM
       ============================================================= */

    .visual-scrim {

      position: absolute;

      inset: 0;

      pointer-events: none;

      /*
       * Much lighter than before.
       * The robot and city stay visible.
       */

      background:

        linear-gradient(
          180deg,
          rgba(2,7,18,.04) 0%,
          rgba(2,7,18,.03) 45%,
          rgba(2,7,18,.12) 75%,
          rgba(2,7,18,.38) 100%
        ),

        linear-gradient(
          90deg,
          rgba(2,7,18,.18) 0%,
          rgba(2,7,18,.02) 55%,
          rgba(2,7,18,.12) 100%
        );

    }

    /* =============================================================
       LIGHT MODE IMAGE
       ============================================================= */

    .auth-screen.light-mode
    .visual-photo {

      filter:
        saturate(.92)
        contrast(1.02)
        brightness(1.08);

    }

    .auth-screen.light-mode
    .visual-scrim {

      background:

        linear-gradient(
          180deg,
          rgba(255,255,255,.02) 0%,
          rgba(255,255,255,.00) 50%,
          rgba(3,15,30,.20) 100%
        ),

        linear-gradient(
          90deg,
          rgba(255,255,255,.04) 0%,
          rgba(255,255,255,0) 70%
        );

    }

    /* =============================================================
       BLUE GLOW
       ============================================================= */

    .visual-glow {

      position: absolute;

      width: 420px;

      height: 420px;

      left: -180px;

      bottom: -230px;

      border-radius: 50%;

      background:
        rgba(31,120,201,.12);

      filter:
        blur(80px);

      pointer-events: none;

    }

    /* =============================================================
       SCANLINES
       ============================================================= */

    .scanlines {

      position: absolute;

      inset: 0;

      pointer-events: none;

      opacity: .08;

      background-image:

        repeating-linear-gradient(
          180deg,
          rgba(255,255,255,.025) 0,
          rgba(255,255,255,.025) 1px,
          transparent 1px,
          transparent 4px
        );

    }

    /* =============================================================
       BRAND
       ============================================================= */

    .visual-brand {

      position: absolute;

      left: 58px;

      top: 135px;

      z-index: 5;

      width:
        min(
          520px,
          calc(100% - 100px)
        );

    }

    .brand-category {

      display: flex;

      align-items: center;

      gap: 12px;

      margin-bottom: 13px;

      color: #1764A3;

      font-family: monospace;

      font-size: 10px;

      font-weight: 800;

      letter-spacing: .20em;

      text-shadow:
        0 0 16px
        rgba(23,100,163,.35);

    }

    .brand-line {

      width: 40px;

      height: 1px;

      background: #1764A3;

      box-shadow:
        0 0 12px
        rgba(23,100,163,.55);

    }

    .brand-name {

      margin: 0;

      color: #ffffff;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size:
        clamp(
          52px,
          5.6vw,
          82px
        );

      line-height: .82;

      font-weight: 900;

      letter-spacing: -.065em;

      text-shadow:
        0 5px 30px
        rgba(0,0,0,.45);

    }

    .brand-name-sub {

      margin-top: 9px;

      color: #1764A3;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size:
        clamp(
          32px,
          3.4vw,
          50px
        );

      line-height: .90;

      font-weight: 850;

      letter-spacing: .075em;

      text-shadow:
        0 0 24px
        rgba(23,100,163,.22);

    }

    .brand-description {

      display: flex;

      align-items: center;

      gap: 10px;

      margin-top: 22px;

      color:
        rgba(255,255,255,.58);

      font-family: monospace;

      font-size: 9px;

      font-weight: 700;

      letter-spacing: .18em;

    }

    .description-line {

      width: 52px;

      height: 1px;

      background:
        rgba(255,255,255,.32);

    }

    /* =============================================================
       RIGHT PANEL
       ============================================================= */

    .form-pane {

      min-height: 100vh;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 34px;

      background:
        linear-gradient(
          145deg,
          #06101D,
          #020813
        );

      transition:
        background .35s ease;

    }

    .form-shell {

      position: relative;

      width: 100%;

      max-width: 810px;

      min-height: 700px;

      padding:
        68px
        74px
        58px;

      display: flex;

      align-items: center;

      justify-content: center;

      background:
        linear-gradient(
          145deg,
          rgba(7,19,33,.97),
          rgba(3,11,21,.98)
        );

      border:
        1px solid
        rgba(120,165,205,.16);

      border-radius: 24px;

      box-shadow:
        0 30px 80px
        rgba(0,0,0,.34),

        inset 0 1px 0
        rgba(255,255,255,.04);

      transition:
        background .35s ease,
        border-color .35s ease,
        box-shadow .35s ease;

    }

    /* =============================================================
       LIGHT MODE RIGHT PANEL
       ============================================================= */

    .auth-screen.light-mode
    .form-pane {

      background:
        radial-gradient(
          circle at 90% 0%,
          rgba(45,116,201,.12),
          transparent 40%
        ),

        linear-gradient(
          145deg,
          #F7FAFD,
          #EAF1F8
        );

    }

    .auth-screen.light-mode
    .form-shell {

      background:
        linear-gradient(
          145deg,
          #FFFFFF,
          #F7FAFE
        );

      border-color:
        rgba(30,65,100,.12);

      box-shadow:
        0 30px 80px
        rgba(30,55,80,.14),

        inset 0 1px 0
        rgba(255,255,255,1);

    }

    /* =============================================================
       THEME BUTTON
       ============================================================= */

    .theme-toggle {

      position: absolute;

      top: 26px;

      right: 28px;

      z-index: 20;

      display: inline-flex;

      align-items: center;

      gap: 8px;

      height: 40px;

      padding:
        5px 12px 5px 6px;

      color:
        rgba(235,242,250,.82);

      background:
        rgba(255,255,255,.055);

      border:
        1px solid
        rgba(255,255,255,.14);

      border-radius: 999px;

      font-family: monospace;

      font-size: 8px;

      font-weight: 800;

      letter-spacing: .14em;

      cursor: pointer;

      backdrop-filter:
        blur(14px);

      box-shadow:
        0 8px 25px
        rgba(0,0,0,.20);

      transition:
        all .2s ease;

    }

    .theme-toggle:hover {

      transform:
        translateY(-1px);

      background:
        rgba(255,255,255,.10);

      border-color:
        rgba(255,255,255,.25);

    }

    .theme-icon {

      width: 28px;

      height: 28px;

      display: flex;

      align-items: center;

      justify-content: center;

      border-radius: 50%;

      color: #0B3155;

      background: #F0F6FC;

      font-size: 14px;

    }

    .auth-screen.light-mode
    .theme-toggle {

      color: #173653;

      background:
        #FFFFFF;

      border-color:
        rgba(23,54,83,.14);

      box-shadow:
        0 8px 25px
        rgba(30,55,80,.10);

    }

    .auth-screen.light-mode
    .theme-icon {

      color: #FFFFFF;

      background:
        #173653;

    }

    /* =============================================================
       AUTH CONTENT
       ============================================================= */

    .auth-view {

      width: 100%;

      max-width: 660px;

    }

    .eyebrow {

      display: flex;

      align-items: center;

      gap: 12px;

      margin-bottom: 20px;

      color:
        #2D74C9;

      font-family: monospace;

      font-size: 10px;

      font-weight: 800;

      letter-spacing: .18em;

    }

    .eyebrow span {

      width: 34px;

      height: 1px;

      background:
        #2D74C9;

      box-shadow:
        0 0 10px
        rgba(45,116,201,.45);

    }

    h1 {

      margin: 0;

      color:
        #F5F9FD;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size:
        clamp(
          42px,
          4vw,
          60px
        );

      line-height: 1;

      font-weight: 800;

      letter-spacing: -.045em;

    }

    h1 strong {

      color:
        #2D74C9;

      font-weight: 800;

    }

    .subtitle {

      margin:
        18px 0 42px;

      color:
        rgba(220,232,245,.60);

      font-size: 15px;

      line-height: 1.6;

    }

    /* =============================================================
       LIGHT TEXT
       ============================================================= */

    .auth-screen.light-mode h1 {

      color: #102A43;

    }

    .auth-screen.light-mode
    .subtitle {

      color:
        rgba(24,48,73,.62);

    }

    /* =============================================================
       GOOGLE
       ============================================================= */

    .google-btn-container {

      width: 100%;

      margin-bottom: 18px;

    }

    .divider {

      display: flex;

      align-items: center;

      gap: 12px;

      margin:
        8px 0 22px;

      color:
        rgba(220,232,245,.30);

      font-family: monospace;

      font-size: 9px;

      letter-spacing: .12em;

    }

    .divider::before,
    .divider::after {

      content: '';

      flex: 1;

      height: 1px;

      background:
        rgba(120,165,205,.12);

    }

    /* =============================================================
       FORM
       ============================================================= */

    form {

      display: flex;

      flex-direction: column;

      gap: 18px;

    }

    .field {

      display: flex;

      flex-direction: column;

      gap: 8px;

    }

    .field-label {

      color:
        rgba(220,232,245,.48);

      font-family: monospace;

      font-size: 9px;

      font-weight: 800;

      letter-spacing: .13em;

    }

    .field-input-wrap {

      display: flex;

      align-items: center;

      min-height: 58px;

      background:
        rgba(255,255,255,.035);

      border:
        1px solid
        rgba(150,170,195,.15);

      border-radius: 12px;

      transition:
        border-color .2s ease,
        background .2s ease,
        box-shadow .2s ease;

    }

    .field-input-wrap:hover {

      border-color:
        rgba(255,255,255,.25);

    }

    .field-input-wrap:focus-within {

      background:
        rgba(25,78,138,.055);

      border-color:
        rgba(45,116,201,.72);

      box-shadow:
        0 0 0 3px
        rgba(32,102,183,.10);

    }

    .field-icon {

      flex:
        0 0 auto;

      margin-left: 15px;

      color:
        rgba(220,232,245,.42);

      transition:
        color .2s ease;

    }

    .field-input-wrap:focus-within
    .field-icon {

      color:
        #2D74C9;

    }

    /* =============================================================
       INPUTS - DARK MODE
       ============================================================= */

    input[type='email'],
    input[type='password'],
    input[type='text'] {

      flex: 1;

      min-width: 0;

      width: 100%;

      padding:
        15px 13px;

      border: none;

      outline: none;

      background:
        transparent !important;

      color:
        #F5F9FD !important;

      caret-color:
        #F5F9FD;

      font-family: inherit;

      font-size: 14px;

      appearance: none;

    }

    input::placeholder {

      color:
        rgba(245,249,253,.58) !important;

      opacity: 1;

    }

    /* =============================================================
       LIGHT MODE INPUTS
       ============================================================= */

    .auth-screen.light-mode
    input[type='email'],

    .auth-screen.light-mode
    input[type='password'],

    .auth-screen.light-mode
    input[type='text'] {

      color:
        #102A43 !important;

      caret-color:
        #102A43;

    }

    .auth-screen.light-mode
    input::placeholder {

      /*
       * DARK placeholder on the white panel.
       */

      color:
        rgba(16,42,67,.58) !important;

      opacity: 1;

    }

    .auth-screen.light-mode
    .field-label {

      color:
        rgba(24,48,73,.55);

    }

    .auth-screen.light-mode
    .field-input-wrap {

      background:
        rgba(255,255,255,.86);

      border-color:
        rgba(35,71,108,.16);

    }

    .auth-screen.light-mode
    .field-input-wrap:hover {

      border-color:
        rgba(35,71,108,.28);

    }

    .auth-screen.light-mode
    .field-input-wrap:focus-within {

      background:
        #FFFFFF;

      border-color:
        rgba(45,116,201,.65);

      box-shadow:
        0 0 0 3px
        rgba(45,116,201,.10);

    }

    .auth-screen.light-mode
    .field-icon {

      color:
        rgba(24,48,73,.45);

    }

    .auth-screen.light-mode
    .field-input-wrap:focus-within
    .field-icon {

      color:
        #2D74C9;

    }

    /* =============================================================
       AUTOFILL - DARK
       ============================================================= */

    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {

      -webkit-text-fill-color:
        #F5F9FD !important;

      caret-color:
        #F5F9FD !important;

      -webkit-box-shadow:
        0 0 0 1000px
        #06101D inset !important;

      box-shadow:
        0 0 0 1000px
        #06101D inset !important;

      transition:
        background-color
        9999s
        ease-out
        0s;

    }

    /* =============================================================
       AUTOFILL - LIGHT
       ============================================================= */

    .auth-screen.light-mode
    input:-webkit-autofill,

    .auth-screen.light-mode
    input:-webkit-autofill:hover,

    .auth-screen.light-mode
    input:-webkit-autofill:focus,

    .auth-screen.light-mode
    input:-webkit-autofill:active {

      -webkit-text-fill-color:
        #102A43 !important;

      caret-color:
        #102A43 !important;

      -webkit-box-shadow:
        0 0 0 1000px
        #FFFFFF inset !important;

      box-shadow:
        0 0 0 1000px
        #FFFFFF inset !important;

    }

    /* =============================================================
       PASSWORD TOGGLE
       ============================================================= */

    .field-toggle {

      flex:
        0 0 auto;

      width: 38px;

      height: 38px;

      margin-right: 5px;

      display: flex;

      align-items: center;

      justify-content: center;

      color:
        rgba(220,232,245,.42);

      background:
        transparent;

      border: none;

      border-radius: 7px;

      cursor: pointer;

      transition:
        color .15s ease,
        background .15s ease;

    }

    .field-toggle:hover {

      color:
        #2D74C9;

      background:
        rgba(22,74,120,.08);

    }

    .auth-screen.light-mode
    .field-toggle {

      color:
        rgba(24,48,73,.42);

    }

    /* =============================================================
       REMEMBER
       ============================================================= */

    .row-between {

      display: flex;

      align-items: center;

      justify-content: space-between;

      gap: 15px;

    }

    .remember {

      display: flex;

      align-items: center;

      gap: 8px;

      color:
        rgba(220,232,245,.55);

      font-size: 12px;

      cursor: pointer;

      user-select: none;

    }

    .auth-screen.light-mode
    .remember {

      color:
        rgba(24,48,73,.62);

    }

    .remember input {

      position: absolute;

      width: 1px;

      height: 1px;

      opacity: 0;

    }

    .checkbox-visual {

      width: 17px;

      height: 17px;

      display: flex;

      align-items: center;

      justify-content: center;

      color: transparent;

      border:
        1px solid
        rgba(255,255,255,.22);

      border-radius: 4px;

      transition: .15s ease;

    }

    .remember input:checked
    + .checkbox-visual {

      color: #FFFFFF;

      background:
        #1764A3;

      border-color:
        #1764A3;

    }

    .auth-screen.light-mode
    .checkbox-visual {

      border-color:
        rgba(24,48,73,.22);

    }

    .forgot-link {

      color:
        #2D74C9;

      font-size: 11.5px;

      font-weight: 700;

      text-decoration: none;

    }

    .forgot-link:hover {

      text-decoration: underline;

    }

    /* =============================================================
       PASSWORD RULES
       ============================================================= */

    .password-hint {

      display: flex;

      flex-wrap: wrap;

      gap: 7px;

      margin-top: -4px;

    }

    .password-hint span {

      padding:
        6px 8px;

      color:
        rgba(220,232,245,.38);

      background:
        rgba(255,255,255,.025);

      border:
        1px solid
        rgba(255,255,255,.055);

      border-radius: 6px;

      font-size: 9.5px;

    }

    .auth-screen.light-mode
    .password-hint span {

      color:
        rgba(24,48,73,.50);

      background:
        rgba(25,62,98,.035);

      border-color:
        rgba(25,62,98,.09);

    }

    .password-hint b {

      margin-right: 4px;

      color:
        rgba(220,232,245,.22);

    }

    .password-hint span.valid {

      color:
        rgba(23,100,163,.90);

      border-color:
        rgba(23,100,163,.20);

    }

    .password-hint span.valid b {

      color:
        #1764A3;

    }

    /* =============================================================
       ERROR
       ============================================================= */

    .error {

      margin:
        -2px 0 0;

      padding:
        10px 12px;

      color:
        #A9C5E2;

      background:
        rgba(22,74,120,.16);

      border:
        1px solid
        rgba(22,74,120,.28);

      border-radius: 8px;

      font-size: 11.5px;

    }

    .auth-screen.light-mode
    .error {

      color:
        #28547C;

      background:
        rgba(45,116,201,.07);

      border-color:
        rgba(45,116,201,.18);

    }

    /* =============================================================
       PRIMARY BUTTON
       ============================================================= */

    .primary-button {

      position: relative;

      width: 100%;

      min-height: 58px;

      display: flex;

      align-items: center;

      justify-content: center;

      gap: 9px;

      margin-top: 4px;

      color: #FFFFFF;

      background:
        linear-gradient(
          135deg,
          #2D74C9,
          #15559A
        );

      border: none;

      border-radius: 13px;

      font-family: monospace;

      font-size: 11px;

      font-weight: 800;

      letter-spacing: .08em;

      cursor: pointer;

      box-shadow:
        0 15px 35px
        rgba(22,74,120,.25);

      transition:
        transform .2s ease,
        box-shadow .2s ease,
        filter .2s ease;

    }

    .primary-button:hover:not(:disabled) {

      transform:
        translateY(-2px);

      filter:
        brightness(1.07);

      box-shadow:
        0 20px 42px
        rgba(22,74,120,.34);

    }

    .primary-button:active:not(:disabled) {

      transform:
        translateY(0);

    }

    .primary-button:disabled {

      opacity: .45;

      cursor: not-allowed;

      box-shadow: none;

    }

    .primary-button.success {

      background:
        linear-gradient(
          135deg,
          #0A1726,
          #020813
        );

      opacity: 1;

    }

    .button-arrow {

      font-size: 19px;

      line-height: 0;

    }

    .btn-spinner {

      width: 15px;

      height: 15px;

      border:
        2px solid
        rgba(255,255,255,.28);

      border-top-color:
        #FFFFFF;

      border-radius: 50%;

      animation:
        spin .65s
        linear infinite;

    }

    @keyframes spin {

      to {
        transform:
          rotate(360deg);
      }

    }

    .btn-check {

      animation:
        checkPop .35s
        ease both;

    }

    @keyframes checkPop {

      from {

        opacity: 0;

        transform:
          scale(.6);

      }

      to {

        opacity: 1;

        transform:
          scale(1);

      }

    }

    /* =============================================================
       SWITCH
       ============================================================= */

    .switch-link {

      margin:
        23px 0 0;

      text-align: center;

      color:
        rgba(220,232,245,.42);

      font-size: 12px;

    }

    .auth-screen.light-mode
    .switch-link {

      color:
        rgba(24,48,73,.52);

    }

    .switch-link button {

      padding: 0;

      color:
        #2D74C9;

      background:
        transparent;

      border: none;

      font: inherit;

      font-weight: 700;

      cursor: pointer;

    }

    .switch-link button:hover {

      text-decoration:
        underline;

    }

    /* =============================================================
       BACK BUTTON
       ============================================================= */

    .back-button {

      display: inline-flex;

      align-items: center;

      gap: 7px;

      margin-bottom: 25px;

      padding: 0;

      color:
        rgba(220,232,245,.45);

      background:
        transparent;

      border: none;

      font-size: 11px;

      cursor: pointer;

      transition:
        color .15s ease;

    }

    .back-button:hover {

      color:
        #2D74C9;

    }

    .auth-screen.light-mode
    .back-button {

      color:
        rgba(24,48,73,.55);

    }

    .back-button span {

      font-size: 16px;

    }

    /* =============================================================
       MOBILE BRAND
       ============================================================= */

    .mobile-brand {

      display: none;

      margin-bottom: 35px;

    }

    .mobile-brand-name {

      color:
        #FFFFFF;

      font-size: 40px;

      font-weight: 900;

      letter-spacing:
        -.06em;

    }

    .mobile-brand-sub {

      color:
        #1764A3;

      font-size: 22px;

      font-weight: 800;

      letter-spacing: .08em;

    }

    .auth-screen.light-mode
    .mobile-brand-name {

      color:
        #102A43;

    }

    /* =============================================================
       MOBILE
       ============================================================= */

    @media (max-width: 1100px) {

      .form-shell {

        padding:
          58px 48px 48px;

      }

      .visual-brand {

        left: 42px;

      }

    }

    @media (max-width: 900px) {

      .auth-screen {

        grid-template-columns: 1fr;

        overflow: auto;

      }

      .visual-pane {

        display: none;

      }

      .form-pane {

        min-height: 100vh;

        padding:
          35px
          max(24px, 6vw);

      }

      .form-shell {

        max-width: 660px;

        min-height: auto;

        padding:
          60px 0 20px;

        background:
          transparent;

        border: none;

        box-shadow: none;

      }

      .mobile-brand {

        display: block;

      }

    }

    @media (max-width: 520px) {

      .form-pane {

        padding:
          24px 20px;

      }

      .form-shell {

        padding-top: 55px;

      }

      .theme-toggle {

        top: 10px;

        right: 0;

      }

      h1 {

        font-size: 40px;

      }

      .subtitle {

        margin-bottom: 32px;

      }

      .row-between {

        align-items:
          flex-start;

      }

      .forgot-link {

        white-space:
          nowrap;

      }

    }

    /* =============================================================
       REDUCED MOTION
       ============================================================= */

    @media (prefers-reduced-motion: reduce) {

      *,
      *::before,
      *::after {

        animation-duration:
          .01ms !important;

        animation-iteration-count:
          1 !important;

        transition-duration:
          .01ms !important;

      }

    }

    /* =============================================================
       SIGNUP-SPECIFIC ADDITIONS
       ============================================================= */

    .field-error {
      margin-top: 6px;
      font-size: 12px;
      color: #E5484D;
    }

    .requirement-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: -6px 0 20px;
    }

    .req-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .02em;
      color: rgba(220,232,245,.45);
      background: rgba(120,165,205,.08);
      border: 1px solid var(--line);
      transition: color .15s ease, background .15s ease, border-color .15s ease;
    }

    .req-pill svg {
      opacity: .35;
      transition: opacity .15s ease;
    }

    .req-pill.met {
      color: #3FBF7F;
      background: rgba(63,191,127,.10);
      border-color: rgba(63,191,127,.35);
    }

    .req-pill.met svg {
      opacity: 1;
    }

    .auth-screen.light-mode .req-pill {
      color: rgba(24,48,73,.5);
      background: rgba(24,48,73,.05);
    }

    .auth-screen.light-mode .req-pill.met {
      color: #1C9A5B;
      background: rgba(28,154,91,.10);
      border-color: rgba(28,154,91,.35);
    }

  `],
})
export class SignupComponent implements AfterViewInit, OnDestroy {
  @ViewChild('googleButton') googleButtonRef?: ElementRef<HTMLDivElement>;

  loading = false;
  signupSuccess = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  googleConfigured = false;

  get darkMode(): boolean {
    return this.themeService.mode() === 'dark';
  }

  form!: ReturnType<FormBuilder['group']>;

  private readonly destroy$ = new Subject<void>();

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
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator }
    );

    this.googleConfigured = this.googleIdentity.isConfigured();
  }

  ngAfterViewInit(): void {
    if (this.googleConfigured && this.googleButtonRef) {
      this.googleIdentity.renderButton(this.googleButtonRef.nativeElement, (idToken: string) =>
        this.handleGoogleCredential(idToken)
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  passwordChecks(): PasswordCheck {
    const value: string = this.form.controls['password'].value || '';
    return {
      length: value.length >= 8,
      upper: /[A-Z]/.test(value),
      number: /\d/.test(value),
    };
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading || this.signupSuccess) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, fullName, password } = this.form.value;

    this.authService
      .register({ email: email!, fullName: fullName!, password: password! })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.signupSuccess = true;
          // Account is created and logged in immediately — no verification step.
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 550);
        },
        error: (err) => {
          this.loading = false;
          const errorData = err?.error;
          this.errorMessage = errorData?.error || 'Unable to create account. Please try again.';
        },
      });
  }

  private handleGoogleCredential(idToken: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService
      .loginWithGoogle(idToken)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.error || 'Google authentication failed.';
        },
      });
  }
}
