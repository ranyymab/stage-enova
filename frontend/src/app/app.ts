import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { MockDataService } from './core/services/mock-data.service';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  anomaliesOuvertes = 0;
  routeTransitioning = false;
  private currentUrl = '';
  private routeTransitionTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly PAGE_LABELS: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/mission': 'Missions',
    '/inspection': 'Inspection',
    '/teleportation': 'Téléopération',
    '/docking': 'Docking',
    '/kilometrage': 'Kilométrage',
    '/anomalies': 'Anomalies',
  };

  constructor(
    private readonly mockData: MockDataService,
    private readonly authService: AuthService,
    private readonly router: Router,
    public readonly themeService: ThemeService
  ) {
    this.currentUrl = this.router.url;

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => (this.currentUrl = e.urlAfterRedirects));

    if (this.authService.isAuthenticated()) {
      this.mockData.getAnomaliesRecentes().subscribe((list) => {
        this.anomaliesOuvertes = list.filter((a) => a.statut !== 'RESOLUE').length;
      });
    }
  }

  isLoginPage(): boolean {
    return this.currentUrl.startsWith('/login');
  }

  pageLabel(): string {
    const match = Object.keys(App.PAGE_LABELS).find((path) => this.currentUrl.startsWith(path));
    return match ? App.PAGE_LABELS[match] : 'Tableau de bord';
  }

  goToNotifications(): void {
    this.router.navigate(['/anomalies']);
  }

  /** Declenche une courte animation de fondu sur le contenu a chaque changement de page. */
  onRouteActivate(): void {
    if (this.routeTransitionTimer) clearTimeout(this.routeTransitionTimer);
    this.routeTransitioning = true;
    this.routeTransitionTimer = setTimeout(() => (this.routeTransitioning = false), 350);
  }
}
