import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FEATURE_PAGE_STYLES } from '../../shared/styles/feature-page.styles';

interface DockingEvent {
  id: number; category: string; missionName: string; info: string; dockingState: string | null;
  eventDate: string; rawHour: string; batteryLevel: number | null;
  latitude: number | null; longitude: number | null; distanceKm: number | null;
}

@Component({
  selector: 'app-docking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1>Docking</h1><span class="page-sub">Cycles de recharge a la station</span></div>
        <div class="date-nav">
          <button class="nav-btn" (click)="prevDay()">&#8249;</button>
          <input type="date" class="date-input" [(ngModel)]="selectedDate" [attr.max]="maxDate" (change)="load()" />
          <button class="nav-btn" (click)="nextDay()">&#8250;</button>
        </div>
      </header>

      <div class="summary-cards three-col" *ngIf="events.length > 0">
        <div class="summary-card"><span class="card-label">Cycles</span><span class="card-value">{{ cycleCount() }}</span></div>
        <div class="summary-card"><span class="card-label">Evenements</span><span class="card-value">{{ events.length }}</span></div>
        <div class="summary-card"><span class="card-label">Batterie max</span><span class="card-value">{{ maxBattery() }}<span class="unit">%</span></span></div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Evenements de docking</h2></div>

        <div class="loading" *ngIf="loading">
          <div class="skeleton-row" *ngFor="let i of [1,2,3]"></div>
        </div>

        <table class="km-table" *ngIf="!loading && events.length > 0">
          <thead><tr><th>Heure</th><th>Type</th><th>Mission</th><th>Batterie</th><th>GPS</th></tr></thead>
          <tbody>
            <tr *ngFor="let e of events">
              <td class="mono">{{ e.rawHour }}</td>
              <td><span class="type-pill" [class.is-start]="isCharging(e)" [class.is-end]="isLeaving(e)">{{ typeLabel(e) }}</span></td>
              <td class="mono">{{ e.missionName ?? '-' }}</td>
              <td class="mono" *ngIf="e.batteryLevel != null">{{ e.batteryLevel }}%</td>
              <td *ngIf="e.batteryLevel == null" class="muted">-</td>
              <td class="mono small" *ngIf="e.latitude">{{ e.latitude?.toFixed(4) }}, {{ e.longitude?.toFixed(4) }}</td>
              <td *ngIf="!e.latitude" class="muted">-</td>
            </tr>
          </tbody>
        </table>

        <div class="empty" *ngIf="!loading && events.length === 0">Aucun evenement de docking pour cette date.</div>
      </div>
    </div>
  `,
  styles: [FEATURE_PAGE_STYLES, `
    .summary-cards.three-col { grid-template-columns: repeat(3, 1fr); }

    .type-pill {
      background: rgba(91, 141, 239, 0.15);
      color: #5B8DEF;
    }
    .type-pill.is-start { background: rgba(61, 220, 151, 0.15); color: #3DDC97; }
    .type-pill.is-end { background: rgba(229, 72, 77, 0.15); color: #E5484D; }
  `],
})
export class DockingComponent implements OnInit {
  private http = inject(HttpClient);
  events: DockingEvent[] = [];
  loading = true;
  readonly maxDate = new Date().toISOString().split('T')[0];
  selectedDate = this.maxDate;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<DockingEvent[]>('http://localhost:8081/api/mission?date=' + this.selectedDate + '&category=DOCKING')
      .subscribe({ next: d => { this.events = d; this.loading = false; }, error: () => { this.loading = false; } });
  }

  prevDay() { const d = new Date(this.selectedDate); d.setDate(d.getDate() - 1); this.selectedDate = d.toISOString().split('T')[0]; this.load(); }
  nextDay() { const d = new Date(this.selectedDate); d.setDate(d.getDate() + 1); this.selectedDate = d.toISOString().split('T')[0]; this.load(); }
  cycleCount() { return this.events.filter(e => e.info === 'docking' && e.dockingState === 'success').length; }
  maxBattery() { const levels = this.events.filter(e => e.batteryLevel != null).map(e => e.batteryLevel!); return levels.length ? Math.max(...levels) : 0; }
  isCharging(e: DockingEvent) { return e.info === 'docking' && e.dockingState === 'success'; }
  isLeaving(e: DockingEvent) { return e.info === 'undocking'; }
  typeLabel(e: DockingEvent): string {
    if (e.info === 'undocking') return 'Depart station';
    if (e.info === 'docking') {
      if (e.dockingState === 'success') return 'Accostage reussi';
      if (e.dockingState === 'failed') return 'Accostage echoue';
      if (e.dockingState?.startsWith('restart')) return 'Nouvelle tentative';
      return 'Accostage en cours';
    }
    return e.info ?? '-';
  }
}
