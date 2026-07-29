import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FEATURE_PAGE_STYLES } from '../../shared/styles/feature-page.styles';

interface KmSummary {
  id: number;
  robotId: string;
  summaryDate: string;
  distanceKm: number;
  dynamicMinutes: number;
  staticMinutes: number;
  totalMinutes: number;
  dynamicPercentage: number;
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
              <td class="mono">{{ s.summaryDate }}</td>
              <td class="mono bold">{{ s.distanceKm.toFixed(2) }} km</td>
              <td class="mono">{{ s.dynamicMinutes.toFixed(0) }} min</td>
              <td class="mono">{{ s.staticMinutes.toFixed(0) }} min</td>
              <td class="mono">{{ s.totalMinutes.toFixed(0) }} min</td>
              <td>
                <div class="pct-bar-wrap">
                  <span class="pct-bar-track"><span class="pct-bar" [style.width.%]="s.dynamicPercentage"></span></span>
                  <span class="mono pct-label">{{ s.dynamicPercentage.toFixed(0) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty" *ngIf="!loading && summaries.length === 0">Aucune donnee disponible.</div>
      </div>
    </div>
  `,
  styles: [FEATURE_PAGE_STYLES, `
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

  ngOnInit() {
    this.http.get<KmSummary[]>('http://localhost:8081/api/kilometrage').subscribe({
      next: d => { this.summaries = [...d].reverse(); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  totalKm() { return this.summaries.reduce((s, x) => s + x.distanceKm, 0); }
  avgKm() { return this.summaries.length ? this.totalKm() / this.summaries.length : 0; }
  maxKm() { return this.summaries.length ? Math.max(...this.summaries.map(s => s.distanceKm)) : 0; }
}
