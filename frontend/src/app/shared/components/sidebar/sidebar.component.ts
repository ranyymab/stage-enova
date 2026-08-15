import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

interface NavItem {
  path: string;
  label: string;
  short: string;
}

@Component({
  selector: 'app-sidebar',

  standalone: true,

  imports: [
    CommonModule,
    RouterModule,
  ],

  template: `

    <button
      type="button"
      class="mobile-toggle"
      (click)="toggleMobile()"
      [attr.aria-expanded]="mobileOpen"
      aria-label="Open navigation"
    >

      <svg
        *ngIf="!mobileOpen"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      >
        <path d="M3 6h18"/>
        <path d="M3 12h18"/>
        <path d="M3 18h18"/>
      </svg>

      <svg
        *ngIf="mobileOpen"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      >
        <path d="M6 6l12 12"/>
        <path d="M18 6L6 18"/>
      </svg>

    </button>

    <div
      *ngIf="mobileOpen"
      class="mobile-backdrop"
      (click)="closeMobile()"
    ></div>

    <aside
      class="sidebar"
      [class.mobile-open]="mobileOpen"
    >

      <div class="brand">

        <div class="brand-mark">

          <img
            *ngIf="!logoMissing"
            class="brand-logo"
            [src]="logoSrc()"
            (error)="onLogoError()"
            alt="Enova Robotics"
          />

          <span
            *ngIf="logoMissing"
            class="brand-fallback"
          >
            EN
          </span>

        </div>

        <div class="brand-text">

          <span class="brand-name">
            ENOVA
          </span>

          <span class="brand-name-sub">
            ROBOTICS
          </span>

          <span class="brand-caption">
            AUTONOMOUS CONTROL
          </span>

        </div>

      </div>

      <div class="robot-status">

        <span class="status-dot"></span>

        <span class="status-text">
          ROBOT-001
        </span>

        <span class="status-online">
          ONLINE
        </span>

      </div>

      <div class="nav-heading">
        COMMAND CENTER
      </div>

      <nav class="nav">

        <a
          *ngFor="let item of navItems"
          class="nav-item"
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{
            exact: item.path === '/dashboard'
          }"
          (click)="closeMobile()"
        >

          <span
            *ngIf="item.path === '/dashboard'"
            class="nav-icon"
          >

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >

              <rect
                x="3"
                y="3"
                width="7"
                height="8"
                rx="1.2"
              />

              <rect
                x="14"
                y="3"
                width="7"
                height="5"
                rx="1.2"
              />

              <rect
                x="14"
                y="12"
                width="7"
                height="9"
                rx="1.2"
              />

              <rect
                x="3"
                y="15"
                width="7"
                height="6"
                rx="1.2"
              />

            </svg>

          </span>

          <span
            *ngIf="item.path === '/mission'"
            class="nav-icon"
          >

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >

              <path
                d="M4 21V4l5 2 6-2 5 2v13l-5-2-6 2z"
              />

              <path d="M9 6v13"/>
              <path d="M15 4v13"/>

            </svg>

          </span>

          <span
            *ngIf="item.path === '/inspection'"
            class="nav-icon"
          >

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >

              <circle
                cx="10.5"
                cy="10.5"
                r="6.5"
              />

              <path
                d="M20 20l-4.8-4.8"
              />

            </svg>

          </span>

          <span
            *ngIf="item.path === '/teleportation'"
            class="nav-icon"
          >

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >

              <rect
                x="4"
                y="10"
                width="16"
                height="8"
                rx="2"
              />

              <circle
                cx="8.5"
                cy="14"
                r="1.2"
                fill="currentColor"
                stroke="none"
              />

              <path d="M13 14h5"/>
              <path d="M12 10V6h4"/>

            </svg>

          </span>

          <span
            *ngIf="item.path === '/docking'"
            class="nav-icon"
          >

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >

              <rect
                x="2.5"
                y="7"
                width="15"
                height="10"
                rx="1.6"
              />

              <path
                d="M17.5 10.5h2.3l1.7 2.2v3.3h-4"
              />

              <path
                d="M11 10.5l-2 3h3l-2 3"
              />

            </svg>

          </span>

          <span
            *ngIf="item.path === '/kilometrage'"
            class="nav-icon"
          >

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >

              <path d="M4 20L15 4"/>
              <path d="M8 20L19 4"/>

              <path d="M9.5 13h2"/>
              <path d="M13 8h2"/>

            </svg>

          </span>

          <span
            *ngIf="item.path === '/anomalies'"
            class="nav-icon"
          >

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >

              <path
                d="M12 3l9.5 16.5H2.5z"
              />

              <path
                d="M12 9.5v4.2"
              />

              <circle
                cx="12"
                cy="16.7"
                r=".7"
                fill="currentColor"
                stroke="none"
              />

            </svg>

          </span>

          <span class="nav-label">
            {{ item.label }}
          </span>

          <span
            *ngIf="
              item.path === '/anomalies' &&
              anomaliesOuvertes > 0
            "
            class="nav-badge"
          >
            {{ anomaliesOuvertes }}
          </span>

          <span class="nav-arrow">
            →
          </span>

        </a>

      </nav>

      <div class="sidebar-footer">

        <div
          class="operator"
          *ngIf="authService.currentUser() as user"
        >

          <div class="operator-avatar">
            {{
              (
                user.fullName ||
                user.email ||
                'OP'
              ).charAt(0).toUpperCase()
            }}
          </div>

          <div class="operator-info">

            <span class="operator-name">
              {{
                user.fullName ||
                user.email
              }}
            </span>

            <span class="operator-role">
              {{ user.role || 'OPERATOR' }}
            </span>

          </div>

        </div>

        <button
          type="button"
          class="footer-button"
          (click)="themeService.toggle()"
        >

          <span class="footer-button-icon">

            <svg
              *ngIf="themeService.mode() === 'dark'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >

              <path
                d="M21 12.8A9 9 0 1 1 11.2 3
                   7 7 0 0 0 21 12.8z"
              />

            </svg>

            <svg
              *ngIf="themeService.mode() !== 'dark'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >

              <circle
                cx="12"
                cy="12"
                r="4"
              />

              <path d="M12 2v2"/>
              <path d="M12 20v2"/>
              <path d="M4.9 4.9l1.4 1.4"/>
              <path d="M17.7 17.7l1.4 1.4"/>
              <path d="M2 12h2"/>
              <path d="M20 12h2"/>
              <path d="M4.9 19.1l1.4-1.4"/>
              <path d="M17.7 6.3l1.4-1.4"/>

            </svg>

          </span>

          <span>

            {{
              themeService.mode() === 'dark'
                ? 'Light mode'
                : 'Dark mode'
            }}

          </span>

        </button>

        <button
          type="button"
          class="logout-button"
          (click)="authService.logout()"
        >

          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >

            <path d="M10 17l5-5-5-5"/>

            <path d="M15 12H3"/>

            <path
              d="M21 19V5a2 2 0 0 0-2-2h-6"
            />

          </svg>

          <span>
            Sign out
          </span>

        </button>

        <div class="footer-system">

          <span class="footer-system-dot"></span>

          SYSTEM OPERATIONAL

        </div>

      </div>

    </aside>

  `,

  styles: [`

    /* =============================================================
       ENOVA LEGACY SIDEBAR
       Navy / blue — matching the new login
       ============================================================= */

    :host {

      --sidebar-width: 285px;

      --navy-950: #020813;
      --navy-900: #06101D;
      --navy-850: #081524;
      --navy-800: #0B1B2D;

      --blue: #2D74C9;
      --blue-bright: #3B82D6;
      --blue-soft: rgba(45,116,201,.14);

      --white: #F4F8FC;
      --muted: rgba(220,232,245,.52);
      --muted-strong: rgba(220,232,245,.72);

      --line: rgba(140,170,205,.13);

      display: block;

      width: var(--sidebar-width);

      height: 100vh;

      flex: 0 0 var(--sidebar-width);

    }

    /* =============================================================
       SIDEBAR
       ============================================================= */

    .sidebar {

      position: fixed;

      top: 0;
      left: 0;
      z-index: 1000;

      width: var(--sidebar-width);

      height: 100vh;

      display: flex;

      flex-direction: column;

      overflow: hidden;

      background:

        radial-gradient(
          circle at 0% 0%,
          rgba(45,116,201,.11),
          transparent 35%
        ),

        linear-gradient(
          180deg,
          #06101D 0%,
          #030A13 100%
        );

      border-right:
        1px solid
        var(--line);

      box-shadow:
        14px 0 45px
        rgba(0,0,0,.16);

      color: var(--white);

    }

    /* subtle technical grid */

    .sidebar::before {

      content: '';

      position: absolute;

      inset: 0;

      pointer-events: none;

      opacity: .045;

      background-image:

        linear-gradient(
          rgba(255,255,255,.18) 1px,
          transparent 1px
        ),

        linear-gradient(
          90deg,
          rgba(255,255,255,.18) 1px,
          transparent 1px
        );

      background-size:
        32px 32px;

    }

    /* =============================================================
       BRAND
       ============================================================= */

    .brand {

      position: relative;

      z-index: 1;

      display: flex;

      align-items: center;

      gap: 12px;

      padding:
        25px 21px 20px;

      border-bottom:
        1px solid
        var(--line);

    }

    .brand-mark {

      width: 42px;

      height: 42px;

      flex: 0 0 42px;

      display: flex;

      align-items: center;

      justify-content: center;

      border:
        1px solid
        rgba(45,116,201,.35);

      border-radius: 11px;

      background:
        linear-gradient(
          145deg,
          rgba(45,116,201,.18),
          rgba(45,116,201,.04)
        );

      box-shadow:
        inset 0 1px 0
        rgba(255,255,255,.05),

        0 8px 25px
        rgba(0,0,0,.18);

    }

    .brand-logo {

      width: 34px;

      height: 34px;

      object-fit: contain;

    }

    .brand-fallback {

      color: #FFFFFF;

      font-family: monospace;

      font-size: 12px;

      font-weight: 900;

      letter-spacing: .08em;

    }

    .brand-text {

      min-width: 0;

      display: flex;

      flex-direction: column;

      line-height: 1;

    }

    .brand-name {

      color: #FFFFFF;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size: 18px;

      font-weight: 900;

      letter-spacing: -.035em;

    }

    .brand-name-sub {

      margin-top: 4px;

      color: var(--blue);

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size: 11px;

      font-weight: 850;

      letter-spacing: .15em;

    }

    .brand-caption {

      margin-top: 7px;

      color:
        rgba(220,232,245,.38);

      font-family: monospace;

      font-size: 7px;

      font-weight: 700;

      letter-spacing: .14em;

      white-space: nowrap;

    }

    /* =============================================================
       ROBOT STATUS
       ============================================================= */

    .robot-status {

      position: relative;

      z-index: 1;

      display: flex;

      align-items: center;

      gap: 8px;

      margin:
        17px 17px 9px;

      padding:
        9px 11px;

      border:
        1px solid
        rgba(45,116,201,.17);

      border-radius: 8px;

      background:
        rgba(45,116,201,.055);

    }

    .status-dot {

      width: 7px;

      height: 7px;

      flex: 0 0 7px;

      border-radius: 50%;

      background: #35C98A;

      box-shadow:
        0 0 0 4px
        rgba(53,201,138,.08),

        0 0 12px
        rgba(53,201,138,.55);

      animation:
        statusPulse 2s
        ease-in-out
        infinite;

    }

    @keyframes statusPulse {

      0%,
      100% {
        opacity: .65;
      }

      50% {
        opacity: 1;
      }

    }

    .status-text {

      color:
        rgba(235,242,250,.76);

      font-family: monospace;

      font-size: 9px;

      font-weight: 800;

      letter-spacing: .10em;

    }

    .status-online {

      margin-left: auto;

      color: #35C98A;

      font-family: monospace;

      font-size: 7px;

      font-weight: 800;

      letter-spacing: .12em;

    }

    /* =============================================================
       NAV HEADING
       ============================================================= */

    .nav-heading {

      position: relative;

      z-index: 1;

      padding:
        14px 23px 8px;

      color:
        rgba(220,232,245,.28);

      font-family: monospace;

      font-size: 7.5px;

      font-weight: 800;

      letter-spacing: .19em;

    }

    /* =============================================================
       NAV
       ============================================================= */

    .nav {

      position: relative;

      z-index: 1;

      display: flex;

      flex-direction: column;

      gap: 4px;

      padding:
        4px 11px;

      flex: 1;

      overflow-y: auto;

      scrollbar-width: thin;

      scrollbar-color:
        rgba(255,255,255,.10)
        transparent;

    }

    .nav-item {

      position: relative;

      display: flex;

      align-items: center;

      gap: 12px;

      min-height: 50px;

      padding:
        0 12px;

      color:
        rgba(220,232,245,.58);

      text-decoration: none;

      border:
        1px solid
        transparent;

      border-radius: 9px;

      font-size: 13.5px;

      font-weight: 600;

      transition:
        background .18s ease,
        color .18s ease,
        border-color .18s ease,
        transform .18s ease;

    }

    .nav-item:hover {

      color: #F4F8FC;

      background:
        rgba(255,255,255,.045);

      border-color:
        rgba(255,255,255,.055);

      transform:
        translateX(2px);

    }

    .nav-item.active {

      color: #FFFFFF;

      background:
        linear-gradient(
          90deg,
          rgba(45,116,201,.20),
          rgba(45,116,201,.07)
        );

      border-color:
        rgba(45,116,201,.23);

      box-shadow:
        inset 0 1px 0
        rgba(255,255,255,.025);

    }

    .nav-item.active::before {

      content: '';

      position: absolute;

      left: -1px;

      top: 9px;

      bottom: 9px;

      width: 3px;

      border-radius:
        0 3px 3px 0;

      background:
        #2D74C9;

      box-shadow:
        0 0 12px
        rgba(45,116,201,.65);

    }

    .nav-icon {

      width: 20px;

      height: 20px;

      flex: 0 0 20px;

      display: inline-flex;

      align-items: center;

      justify-content: center;

      color:
        rgba(220,232,245,.42);

      transition:
        color .18s ease;

    }

    .nav-item:hover .nav-icon {

      color:
        rgba(220,232,245,.82);

    }

    .nav-item.active .nav-icon {

      color:
        #3B82D6;

    }

    .nav-label {

      flex: 1;

      white-space: nowrap;

    }

    .nav-arrow {

      opacity: 0;

      color:
        #3B82D6;

      font-size: 15px;

      transform:
        translateX(-4px);

      transition:
        opacity .18s ease,
        transform .18s ease;

    }

    .nav-item:hover .nav-arrow,
    .nav-item.active .nav-arrow {

      opacity: 1;

      transform:
        translateX(0);

    }

    .nav-badge {

      min-width: 20px;

      height: 20px;

      padding: 0 6px;

      display: inline-flex;

      align-items: center;

      justify-content: center;

      color: #FFFFFF;

      background:
        #B83C46;

      border:
        1px solid
        rgba(255,255,255,.10);

      border-radius: 10px;

      font-family: monospace;

      font-size: 9px;

      font-weight: 800;

      box-shadow:
        0 5px 15px
        rgba(184,60,70,.22);

    }

    /* =============================================================
       FOOTER
       ============================================================= */

    .sidebar-footer {

      position: relative;

      z-index: 1;

      display: flex;

      flex-direction: column;

      gap: 8px;

      padding:
        14px 15px 15px;

      border-top:
        1px solid
        var(--line);

      background:
        rgba(2,8,19,.35);

    }

    .operator {

      display: flex;

      align-items: center;

      gap: 10px;

      padding:
        9px 9px 11px;

      margin-bottom: 2px;

      border-bottom:
        1px solid
        rgba(255,255,255,.055);

    }

    .operator-avatar {

      width: 31px;

      height: 31px;

      flex: 0 0 31px;

      display: flex;

      align-items: center;

      justify-content: center;

      color: #FFFFFF;

      background:
        linear-gradient(
          145deg,
          #2D74C9,
          #164A78
        );

      border-radius: 8px;

      font-family: monospace;

      font-size: 11px;

      font-weight: 800;

      box-shadow:
        0 7px 18px
        rgba(45,116,201,.18);

    }

    .operator-info {

      min-width: 0;

      display: flex;

      flex-direction: column;

      gap: 3px;

    }

    .operator-name {

      overflow: hidden;

      text-overflow: ellipsis;

      white-space: nowrap;

      color:
        rgba(244,248,252,.85);

      font-size: 11px;

      font-weight: 700;

    }

    .operator-role {

      color:
        rgba(220,232,245,.35);

      font-family: monospace;

      font-size: 7px;

      font-weight: 700;

      letter-spacing: .12em;

    }

    .footer-button,
    .logout-button {

      width: 100%;

      min-height: 36px;

      display: flex;

      align-items: center;

      gap: 9px;

      padding:
        0 10px;

      color:
        rgba(220,232,245,.56);

      background:
        rgba(255,255,255,.025);

      border:
        1px solid
        rgba(255,255,255,.07);

      border-radius: 7px;

      font-size: 10.5px;

      font-weight: 600;

      cursor: pointer;

      transition:
        background .18s ease,
        border-color .18s ease,
        color .18s ease;

    }

    .footer-button:hover {

      color: #FFFFFF;

      background:
        rgba(45,116,201,.10);

      border-color:
        rgba(45,116,201,.25);

    }

    .footer-button-icon {

      width: 19px;

      height: 19px;

      display: flex;

      align-items: center;

      justify-content: center;

      color:
        #3B82D6;

    }

    .logout-button {

      justify-content: center;

      color:
        rgba(220,232,245,.40);

      background:
        transparent;

    }

    .logout-button:hover {

      color:
        #E06A72;

      background:
        rgba(184,60,70,.08);

      border-color:
        rgba(184,60,70,.20);

    }

    .footer-system {

      display: flex;

      align-items: center;

      justify-content: center;

      gap: 7px;

      padding-top: 3px;

      color:
        rgba(220,232,245,.22);

      font-family: monospace;

      font-size: 7px;

      font-weight: 700;

      letter-spacing: .12em;

    }

    .footer-system-dot {

      width: 5px;

      height: 5px;

      border-radius: 50%;

      background: #35C98A;

      box-shadow:
        0 0 7px
        rgba(53,201,138,.55);

    }

    /* =============================================================
       MOBILE
       ============================================================= */

    .mobile-toggle {

      display: none;

    }

    .mobile-backdrop {

      display: none;

    }

    @media (max-width: 860px) {

      :host {

        width: 0;

        height: 0;

      }

      .mobile-toggle {

        position: fixed;

        top: 14px;

        left: 14px;

        z-index: 500;

        width: 42px;

        height: 42px;

        display: flex;

        align-items: center;

        justify-content: center;

        color: #FFFFFF;

        background:
          #081524;

        border:
          1px solid
          rgba(45,116,201,.30);

        border-radius: 10px;

        box-shadow:
          0 10px 30px
          rgba(0,0,0,.25);

        cursor: pointer;

      }

      .mobile-backdrop {

        position: fixed;

        inset: 0;

        z-index: 399;

        display: block;

        background:
          rgba(0,0,0,.58);

        backdrop-filter:
          blur(3px);

      }

      .sidebar {

        position: fixed;

        z-index: 460;

        left: 0;

        top: 0;

        width:
          min(
            290px,
            86vw
          );

        transform:
          translateX(-105%);

        transition:
          transform .28s
          cubic-bezier(.16,1,.3,1);

      }

      .sidebar.mobile-open {

        transform:
          translateX(0);

      }

    }

    @media (prefers-reduced-motion: reduce) {

      .sidebar,
      .nav-item,
      .nav-arrow,
      .status-dot {

        transition: none !important;

        animation: none !important;

      }

    }

  `],
})

export class SidebarComponent {

  @Input()
  anomaliesOuvertes = 0;

  logoMissing = false;

  private darkLogoFailed = false;

  mobileOpen = false;

  constructor(

    public readonly authService: AuthService,

    public readonly themeService: ThemeService,

  ) {}

  logoSrc(): string {

    if (
      this.themeService.mode() === 'dark' &&
      !this.darkLogoFailed
    ) {

      return '/assets/enova-logo-dark.png';

    }

    return '/assets/enova-logo.png';

  }

  onLogoError(): void {

    if (
      this.themeService.mode() === 'dark' &&
      !this.darkLogoFailed
    ) {

      this.darkLogoFailed = true;

      return;

    }

    this.logoMissing = true;

  }

  toggleMobile(): void {

    this.mobileOpen =
      !this.mobileOpen;

  }

  closeMobile(): void {

    this.mobileOpen = false;

  }

  navItems: NavItem[] = [

    {
      path: '/dashboard',
      label: 'Dashboard',
      short: 'DB',
    },

    {
      path: '/mission',
      label: 'Missions',
      short: 'MS',
    },

    {
      path: '/inspection',
      label: 'Inspection',
      short: 'IN',
    },

    {
      path: '/teleportation',
      label: 'Teleoperation',
      short: 'TP',
    },

    {
      path: '/docking',
      label: 'Docking',
      short: 'DK',
    },

    {
      path: '/kilometrage',
      label: 'Kilometrage',
      short: 'KM',
    },

    {
      path: '/anomalies',
      label: 'Anomalies',
      short: 'AN',
    },

  ];

}
