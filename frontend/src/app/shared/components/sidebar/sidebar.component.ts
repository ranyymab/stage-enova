import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

interface NavItem {
  path: string;
  label: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <button class="mobile-toggle" (click)="toggleMobile()" type="button" [attr.aria-expanded]="mobileOpen" aria-label="Ouvrir le menu">
      <svg *ngIf="!mobileOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      <svg *ngIf="mobileOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <div class="mobile-backdrop" *ngIf="mobileOpen" (click)="closeMobile()"></div>

    <aside class="sidebar" [class.mobile-open]="mobileOpen">
      <div class="brand">
        <img class="brand-logo" [src]="logoSrc()" *ngIf="!logoMissing"
             (error)="onLogoError()" alt="Enova Robotics" />
        <span class="brand-fallback" *ngIf="logoMissing">EN</span>
        <div class="brand-text">
          <span class="brand-name">Enova Robotics</span>
          <span class="brand-sub">Surveillance</span>
        </div>
      </div>

      <div class="robot-id">ROBOT-001</div>

      <nav class="nav">
        <a
          *ngFor="let item of navItems"
          [routerLink]="item.path"
          routerLinkActive="active"
          class="nav-item"
          (click)="closeMobile()"
        >
          <span class="nav-icon" [ngSwitch]="item.path">
            <svg *ngSwitchCase="'/dashboard'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.2"/><rect x="14" y="3" width="7" height="5" rx="1.2"/><rect x="14" y="12" width="7" height="9" rx="1.2"/><rect x="3" y="16" width="7" height="5" rx="1.2"/></svg>
            <svg *ngSwitchCase="'/mission'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4l5 2 6-2 5 2v13l-5-2-6 2z"/><path d="M9 6v13M15 4v13"/></svg>
            <svg *ngSwitchCase="'/inspection'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>
            <svg *ngSwitchCase="'/teleportation'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="8" rx="2"/><circle cx="8.5" cy="14" r="1.3" fill="currentColor" stroke="none"/><path d="M13 14h5M12 10V6h4"/></svg>
            <svg *ngSwitchCase="'/docking'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7" width="15" height="10" rx="1.6"/><path d="M17.5 10.5h2.3l1.7 2.2v3.3h-4"/><path d="M11 10.5l-2 3h3l-2 3"/></svg>
            <svg *ngSwitchCase="'/kilometrage'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L15 4M8 20L19 4"/><path d="M9.5 13h2M13 8h2"/></svg>
            <svg *ngSwitchCase="'/anomalies'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9.5 16.5H2.5z"/><path d="M12 9.5v4.2"/><circle cx="12" cy="16.7" r="0.6" fill="currentColor" stroke="none"/></svg>
          </span>
          <span class="nav-label">{{ item.label }}</span>
          <span
            *ngIf="item.path === '/anomalies' && anomaliesOuvertes > 0"
            class="nav-badge"
          >{{ anomaliesOuvertes }}</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" *ngIf="authService.currentUser() as user">
          <span class="user-name">{{ user.fullName || user.email }}</span>
          <span class="user-role">{{ user.role }}</span>
        </div>
        <button class="theme-toggle" (click)="themeService.toggle()" type="button">
          <svg *ngIf="themeService.mode() === 'dark'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg *ngIf="themeService.mode() !== 'dark'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          <span>{{ themeService.mode() === 'dark' ? 'Mode sombre' : 'Mode clair' }}</span>
        </button>
        <button class="logout-btn" (click)="authService.logout()">Déconnexion</button>
        <span class="footer-hours">Surveillance nocturne · 20:00 — 06:00</span>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 220px;
      height: 100vh;
      background: var(--panel-base);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    /* ---- responsive : sidebar devient un tiroir plein ecran sous 860px ---- */
    .mobile-toggle {
      display: none;
    }

    @media (max-width: 860px) {
      .mobile-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        top: 12px;
        left: 12px;
        z-index: 300;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: var(--panel-base);
        border: 1px solid var(--border-subtle);
        color: var(--text-primary);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        cursor: pointer;
      }

      .mobile-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 199;
        animation: backdropFadeIn 0.2s ease both;
      }

      @keyframes backdropFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 200;
        width: min(280px, 82vw);
        transform: translateX(-100%);
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }
    }

    @media (max-width: 860px) and (prefers-reduced-motion: reduce) {
      .sidebar { transition: none; }
      .mobile-backdrop { animation: none; }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 18px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .brand-logo {
      width: 40px;
      height: 40px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .brand-fallback {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: var(--accent-primary);
      color: #fff;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .brand-name {
      font-weight: 700;
      font-size: 15px;
      color: var(--text-primary);
    }

    .brand-sub {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .robot-id {
      margin: 14px 18px 6px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      letter-spacing: 0.06em;
    }

    .nav {
      display: flex;
      flex-direction: column;
      padding: 6px 10px;
      gap: 2px;
      flex: 1;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;

      border-radius: 6px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 13.5px;
      position: relative;
      overflow: hidden;
      transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
    }

    .nav-item:hover {
      background: var(--panel-raised);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: var(--accent-primary-soft);
      color: var(--accent-primary);
      font-weight: 600;
    }

    .nav-item.active .nav-icon {
      color: var(--accent-primary);
    }

    .nav-icon {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      flex-shrink: 0;
      transition: color 0.15s ease;
    }

    .nav-label {
      flex: 1;
    }

    .nav-badge {
      background: var(--accent-critical);
      color: #fff;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      animation: badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes badgePop {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .nav-item, .nav-icon, .theme-toggle, .logout-btn, .nav-badge {
        transition: none !important;
        animation: none !important;
      }
    }

    .sidebar-footer {
      padding: 14px 18px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .user-name {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 10.5px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--panel-raised);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 12.5px;
      font-weight: 600;
      padding: 7px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .theme-toggle:hover {
      background: var(--accent-primary-soft);
      color: var(--accent-primary);
    }

    .logout-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .logout-btn:hover {
      background: var(--panel-raised);
      color: var(--accent-critical);
      border-color: var(--accent-critical);
    }

    .footer-text {
      font-size: 11px;
      color: var(--text-muted);
    }

    .footer-hours {
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--text-muted);
    }
  `],
})
export class SidebarComponent {
  @Input() anomaliesOuvertes = 0;
  /** Vrai seulement si AUCUNE version du logo (claire ou sombre) n'est disponible. */
  logoMissing = false;
  /** Vrai si la version sombre du logo a echoue -> on retombe sur la version claire plutot que sur le texte "EN". */
  private darkLogoFailed = false;
  mobileOpen = false;

  constructor(
    public readonly authService: AuthService,
    public readonly themeService: ThemeService,
  ) {}

  /**
   * Le logo clair (fond blanc, texte sombre) ressort mal sur la sidebar en
   * mode sombre - voir capture d'ecran fournie. En mode sombre, on utilise
   * une variante dediee (fond transparent / texte clair) si elle a ete
   * ajoutee ; sinon on retombe sur la version claire plutot que sur rien.
   */
  logoSrc(): string {
    if (this.themeService.mode() === 'dark' && !this.darkLogoFailed) {
      return '/assets/enova-logo-dark.png';
    }
    return '/assets/enova-logo.png';
  }

  onLogoError(): void {
    if (this.themeService.mode() === 'dark' && !this.darkLogoFailed) {
      // La variante sombre n'existe pas encore -> on retente avec la claire.
      this.darkLogoFailed = true;
      return;
    }
    // Meme la version claire est absente -> repli texte "EN".
    this.logoMissing = true;
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile(): void {
    this.mobileOpen = false;
  }

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Tableau de bord' },
    { path: '/mission', label: 'Missions' },
    { path: '/inspection', label: 'Inspection' },
    { path: '/teleportation', label: 'Téléopération' },
    { path: '/docking', label: 'Docking' },
    { path: '/kilometrage', label: 'Kilométrage' },
    { path: '/anomalies', label: 'Anomalies' },
  ];
}
