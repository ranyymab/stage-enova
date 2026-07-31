import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FEATURE_PAGE_STYLES } from '../../shared/styles/feature-page.styles';

interface TeleoperationEvent {
  id: number; robotId: string; eventDate: string; rawHour: string;
  mode: string; info: string; latitude: number | null; longitude: number | null;
}

@Component({
  selector: 'app-teleportation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1>Teleoperation</h1><span class="page-sub">Sessions de controle manuel</span></div>
        <div class="date-nav">
          <button class="nav-btn" (click)="prevDay()">&#8249;</button>
          <input type="date" class="date-input" [(ngModel)]="selectedDate" [attr.max]="maxDate" (change)="load()" />
          <button class="nav-btn" (click)="nextDay()">&#8250;</button>
        </div>
      </header>

      <div class="summary-cards two-col">
        <div class="summary-card"><span class="card-label">Sessions</span><span class="card-value">{{ sessionCount() }}</span></div>
        <div class="summary-card"><span class="card-label">Evenements</span><span class="card-value">{{ events.length }}</span></div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Historique</h2></div>

        <div class="loading" *ngIf="loading">
          <div class="skeleton-row" *ngFor="let i of [1,2,3]"></div>
        </div>

        <div class="events-list" *ngIf="!loading && events.length > 0">
          <div class="event-row" *ngFor="let e of events">
            <span class="event-time mono">{{ e.rawHour }}</span>
            <span class="event-mode" [class.is-start]="e.info === 'start'" [class.is-end]="e.info === 'end'">
              {{ e.info === 'start' ? 'Debut session' : e.info === 'end' ? 'Fin session' : e.info }}
            </span>
            <span class="event-meta mono" *ngIf="e.mode">Mode: {{ e.mode }}</span>
            <span class="event-gps mono" *ngIf="e.latitude">{{ e.latitude?.toFixed(4) }}, {{ e.longitude?.toFixed(4) }}</span>
          </div>
        </div>

        <div class="empty" *ngIf="!loading && events.length === 0">Aucune session de teleoperation pour cette date.</div>
      </div>
    </div>
  `,
  styles: [FEATURE_PAGE_STYLES, `
    .summary-cards.two-col {
      grid-template-columns: repeat(2, 1fr);
      max-width: 420px;
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .event-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 4px;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 13px;
      transition: background 0.12s ease;
      animation: rowFadeIn 0.35s ease both;
    }

    .event-row:hover { background: var(--panel-raised); }
    .event-row:last-child { border-bottom: none; }

    .event-time { color: var(--text-muted); min-width: 80px; }
    .event-mode { flex: 1; color: var(--text-primary); font-weight: 600; }
    .event-mode.is-start { color: var(--accent-active); }
    .event-mode.is-end { color: var(--accent-critical); }
    .event-meta { color: var(--text-muted); }
    .event-gps { color: var(--text-muted); font-size: 11px; }
  `],
})
export class TeleoperationComponent implements OnInit {
  private http = inject(HttpClient);
  events: TeleoperationEvent[] = [];
  loading = true;
  readonly maxDate = new Date().toISOString().split('T')[0];
  selectedDate = this.maxDate;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<TeleoperationEvent[]>('https://stage-enova-3.onrender.com/api/teleportation?date=' + this.selectedDate)
      .subscribe({ next: d => { this.events = d; this.loading = false; }, error: () => { this.loading = false; } });
  }

  prevDay() { const d = new Date(this.selectedDate); d.setDate(d.getDate() - 1); this.selectedDate = d.toISOString().split('T')[0]; this.load(); }
  nextDay() { const d = new Date(this.selectedDate); d.setDate(d.getDate() + 1); this.selectedDate = d.toISOString().split('T')[0]; this.load(); }
  sessionCount() { return this.events.filter(e => e.info === 'start').length; }
}
