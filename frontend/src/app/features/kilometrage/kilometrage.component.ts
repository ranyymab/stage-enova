import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FEATURE_PAGE_STYLES } from '../../shared/styles/feature-page.styles';

interface KmSummary {
  id: number;
  robotId: string;
  summaryDate: string | null;
  distanceKm: number | null;
  dynamicMinutes: number | null;
  staticMinutes: number | null;
  totalMinutes: number | null;
  dynamicPercentage: number | null;
}

@Component({
  selector: 'app-kilometrage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Kilometrage</h1>
          <span class="page-sub">Historique complet - ROBOT-001</span>
        </div>
      </header>

      <div class="summary-cards" *ngIf="summaries.length > 0">
        <div class="summary-card">
          <span class="card-label">Distance totale</span>
          <span class="card-value">{{ totalKm().toFixed(2) }}<span class="unit"> km</span></span>
        </div>
        <div class="summary-card">
          <span class="card-label">Jours actifs</span>
          <span class="card-value">{{ summaries.length }}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Moyenne / jour</span>
          <span class="card-value">{{ avgKm().toFixed(2) }}<span class="unit"> km</span></span>
        </div>
        <div class="summary-card">
          <span class="card-label">Meilleure journee</span>
          <span class="card-value">{{ maxKm().toFixed(2) }}<span class="unit"> km</span></span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Detail par jour</h2></div>

        <div class="loading" *ngIf="loading">
          <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>
        </div>

        <table class="km-table" *ngIf="!loading && summaries.length > 0">
          <thead>
            <tr><th>Date</th><th>Distance</th><th>Dynamique</th><th>Statique</th><th>Total</th><th>% Dyn</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of summaries">
              <td class="mono">{{ s.summaryDate ?? '—' }}</td>
              <td class="mono bold">{{ (s.distanceKm ?? 0).toFixed(2) }} km</td>
              <td class="mono">{{ (s.dynamicMinutes ?? 0).toFixed(0) }} min</td>
              <td class="mono">{{ (s.staticMinutes ?? 0).toFixed(0) }} min</td>
              <td class="mono">{{ (s.totalMinutes ?? 0).toFixed(0) }} min</td>
              <td>
                <div class="pct-bar-wrap">
                  <span class="pct-bar-track"><span class="pct-bar" [style.width.%]="s.dynamicPercentage ?? 0"></span></span>
                  <span class="mono pct-label">{{ (s.dynamicPercentage ?? 0).toFixed(0) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty" *ngIf="!loading && !loadError && summaries.length === 0">Aucune donnee disponible.</div>

        <div class="empty" *ngIf="!loading && loadError">
          <strong>Impossible de charger l'historique.</strong>
          <span>Le serveur n'a pas repondu (il peut etre en veille et mettre quelques secondes a redemarrer).</span>
          <button type="button" class="retry-btn" (click)="load()">Reessayer</button>
        </div>
      </div>
    </div>
  `,
  styles: [FEATURE_PAGE_STYLES, `
    .retry-btn {
      margin-top: 4px;
      padding: 7px 16px;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: var(--panel-base);
      color: var(--text-primary);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .retry-btn:hover {
      background: var(--panel-raised);
      border-color: var(--accent-primary);
    }
    .pct-bar-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pct-bar-track {
      flex: 1;
      min-width: 70px;
      height: 6px;
      border-radius: 3px;
      background: var(--panel-raised);
      overflow: hidden;
      display: block;
    }

    .pct-bar {
      display: block;
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, var(--accent-active), var(--accent-info));
      transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .pct-label {
      font-size: 12px;
      color: var(--text-muted);
      min-width: 32px;
    }
  `],
})
export class KilometrageComponent implements OnInit {
  private http = inject(HttpClient);
  summaries: KmSummary[] = [];
  loading = true;
  loadError = false;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.loadError = false;
    this.http.get<KmSummary[]>('https://stage-enova-3.onrender.com/api/kilometrage').subscribe({
      next: d => { this.summaries = [...d].reverse(); this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
  }

  totalKm() { return this.summaries.reduce((s, x) => s + (x.distanceKm ?? 0), 0); }
  avgKm() { return this.summaries.length ? this.totalKm() / this.summaries.length : 0; }
  maxKm() { return this.summaries.length ? Math.max(...this.summaries.map(s => s.distanceKm ?? 0)) : 0; }
}