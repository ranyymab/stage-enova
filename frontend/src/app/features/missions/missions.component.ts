import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_ORIGIN } from '../../core/config/api.config';
import { FormsModule } from '@angular/forms';
import { FEATURE_PAGE_STYLES } from '../../shared/styles/feature-page.styles';

interface Mission {
  id: number;
  category: string;
  missionName: string;
  info: string;
  eventDate: string;
  rawHour: string;
  distanceKm: number | null;
  startPoint: string | null;
  stopPoint: string | null;
  batteryLevel: number | null;
}

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Missions</h1>
          <span class="page-sub">Historique des rondes de patrouille</span>
        </div>
        <div class="date-nav">
          <button class="nav-btn" (click)="prevDay()">&#8249;</button>
          <input type="date" class="date-input" [(ngModel)]="selectedDate" [attr.max]="maxDate" (change)="load()" />
          <button class="nav-btn" (click)="nextDay()">&#8250;</button>
        </div>
      </header>

      <div class="summary-cards" *ngIf="missions.length > 0">
        <div class="summary-card">
          <span class="card-label">Missions today</span>
          <span class="card-value">{{ startCount() }}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Distance totale</span>
          <span class="card-value">{{ totalDistance().toFixed(2) }}<span class="unit"> km</span></span>
        </div>
        <div class="summary-card">
          <span class="card-label">Evenements</span>
          <span class="card-value">{{ missions.length }}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Categories actives</span>
          <span class="card-value">{{ activeCategories() }}</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Chronologie</h2></div>

        <div class="loading" *ngIf="loading">
          <div class="skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
        </div>

        <div class="missions-list" *ngIf="!loading">
          <div class="mission-card" *ngFor="let m of missions">
            <div class="mission-top">
              <span class="cat-pill cat-{{ m.category?.toLowerCase() }}">{{ m.category }}</span>
              <span class="mission-name">{{ m.missionName ?? '-' }}</span>
              <span class="mission-type" [class.is-start]="m.info === 'start'" [class.is-end]="m.info === 'end'">
                {{ typeLabel(m.info) }}
              </span>
            </div>
            <div class="mission-meta">
              <span class="mono">{{ m.rawHour }}</span>
              <span *ngIf="m.distanceKm" class="mono">{{ m.distanceKm?.toFixed(2) }} km</span>
              <span *ngIf="m.batteryLevel != null" class="mono">{{ m.batteryLevel }}%</span>
              <span *ngIf="m.startPoint" class="mono">{{ m.startPoint }} &rarr; {{ m.stopPoint ?? '?' }}</span>
            </div>
          </div>

          <div class="empty" *ngIf="missions.length === 0">Aucune mission enregistree pour cette date.</div>
        </div>
      </div>
    </div>
  `,
  styles: [FEATURE_PAGE_STYLES, `
    .missions-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mission-card {
      background: var(--panel-raised);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.15s ease, transform 0.15s ease;
      animation: rowFadeIn 0.35s ease both;
    }

    .mission-card:hover {
      border-color: var(--accent-primary);
      transform: translateX(2px);
    }

    .mission-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cat-mission { background: rgba(61, 220, 151, 0.15); color: #3DDC97; }
    .cat-docking { background: rgba(242, 169, 59, 0.15); color: #F2A93B; }
    .cat-inspecting { background: rgba(91, 141, 239, 0.15); color: #5B8DEF; }
    .cat-back_home { background: rgba(156, 163, 180, 0.15); color: #9BA3B4; }

    .mission-name {
      flex: 1;
      font-size: 14px;
      color: var(--text-primary);
      font-weight: 600;
    }

    .mission-type {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .mission-type.is-start { color: var(--accent-active); }
    .mission-type.is-end { color: var(--accent-critical); }

    .mission-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--text-muted);
    }
  `],
})
export class MissionsComponent implements OnInit {
  private http = inject(HttpClient);
  missions: Mission[] = [];
  loading = false;
  readonly maxDate = new Date().toISOString().split('T')[0];
  selectedDate = this.maxDate;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<Mission[]>(API_ORIGIN + '/api/mission?date=' + this.selectedDate).subscribe({
      next: d => { this.missions = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  prevDay() { const d = new Date(this.selectedDate); d.setDate(d.getDate() - 1); this.selectedDate = d.toISOString().split('T')[0]; this.load(); }
  nextDay() { const d = new Date(this.selectedDate); d.setDate(d.getDate() + 1); this.selectedDate = d.toISOString().split('T')[0]; this.load(); }

  typeLabel(info: string) {
    if (!info) return '';
    if (info === 'start') return 'Debut';
    if (info === 'end') return 'Fin';
    if (info === 'pause') return 'Pause';
    return info;
  }

  startCount() { return this.missions.filter(m => m.info === 'start' && m.category === 'MISSION').length; }
  totalDistance() { return this.missions.reduce((s, m) => s + (m.distanceKm || 0), 0); }
  activeCategories() { return new Set(this.missions.map(m => m.category)).size; }
}
