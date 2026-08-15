import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FEATURE_PAGE_STYLES } from '../../shared/styles/feature-page.styles';

interface InspectionPoint {
  id: number; robotId: string; eventDate: string; eventDatetime: string;
  rawHour: string; missionName: string; lastPoint: string; delaySeconds: number;
  latitude: number | null; longitude: number | null;
}

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1>Inspection</h1><span class="page-sub">Points de passage et retards</span></div>
        <div class="date-nav">
          <button class="nav-btn" (click)="prevDay()">&#8249;</button>
          <input type="date" class="date-input" [(ngModel)]="selectedDate" [attr.max]="maxDate" (change)="load()" />
          <button class="nav-btn" (click)="nextDay()">&#8250;</button>
        </div>
      </header>

      <div class="summary-cards" *ngIf="points.length > 0">
        <div class="summary-card"><span class="card-label">Points visites</span><span class="card-value">{{ points.length }}</span></div>
        <div class="summary-card"><span class="card-label">Retard moyen</span><span class="card-value">{{ avgDelay().toFixed(1) }}<span class="unit">s</span></span></div>
        <div class="summary-card"><span class="card-label">Retard max</span><span class="card-value">{{ maxDelay().toFixed(1) }}<span class="unit">s</span></span></div>
        <div class="summary-card"><span class="card-label">Points en retard</span><span class="card-value late">{{ lateCount() }}</span></div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Points de passage</h2></div>

        <div class="loading" *ngIf="loading">
          <div class="skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
        </div>

        <table class="km-table" *ngIf="!loading && points.length > 0">
          <thead><tr><th>Mission</th><th>Point</th><th>Time</th><th>Delay</th><th>GPS</th></tr></thead>
          <tbody>
            <tr *ngFor="let p of points" [class.row-late]="p.delaySeconds > 30">
              <td class="mono">{{ p.missionName ?? '-' }}</td>
              <td class="mono bold">#{{ p.lastPoint }}</td>
              <td class="mono">{{ p.rawHour }}</td>
              <td><span class="delay-pill" [class.is-late]="p.delaySeconds > 30">{{ p.delaySeconds?.toFixed(1) }}s</span></td>
              <td class="mono small" *ngIf="p.latitude">{{ p.latitude?.toFixed(4) }}, {{ p.longitude?.toFixed(4) }}</td>
              <td *ngIf="!p.latitude" class="muted">-</td>
            </tr>
          </tbody>
        </table>

        <div class="empty" *ngIf="!loading && points.length === 0">Aucun point d'inspection pour cette date.</div>
      </div>
    </div>
  `,
  styles: [FEATURE_PAGE_STYLES],
})
export class InspectionComponent implements OnInit {
  private http = inject(HttpClient);
  points: InspectionPoint[] = [];
  loading = true;
  readonly maxDate = new Date().toISOString().split('T')[0];
  selectedDate = this.maxDate;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<InspectionPoint[]>('https://stage-enova-3.onrender.com/api/inspection?date=' + this.selectedDate)
      .subscribe({ next: d => { this.points = d; this.loading = false; }, error: () => { this.loading = false; } });
  }

  prevDay() { const d = new Date(this.selectedDate); d.setDate(d.getDate() - 1); this.selectedDate = d.toISOString().split('T')[0]; this.load(); }
  nextDay() { const d = new Date(this.selectedDate); d.setDate(d.getDate() + 1); this.selectedDate = d.toISOString().split('T')[0]; this.load(); }
  avgDelay() { return this.points.length ? this.points.reduce((s, p) => s + (p.delaySeconds || 0), 0) / this.points.length : 0; }
  maxDelay() { return this.points.length ? Math.max(...this.points.map(p => p.delaySeconds || 0)) : 0; }
  lateCount() { return this.points.filter(p => p.delaySeconds > 30).length; }
}
