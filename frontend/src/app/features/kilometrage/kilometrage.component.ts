import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_ORIGIN } from '../../core/config/api.config';
import { FEATURE_PAGE_STYLES } from '../../shared/styles/feature-page.styles';

interface KmSummaryApi {
  id?: number;
  robotId?: string;

  summaryDate?: string | null;

  distanceKm?: number | null;
  distance_km?: number | null;

  distanceMeters?: number | null;
  distance_meters?: number | null;

  distance?: number | null;

  totalDistanceKm?: number | null;
  total_distance_km?: number | null;

  kilometers?: number | null;
  km?: number | null;

  dynamicMinutes?: number | null;
  dynamic_minutes?: number | null;

  staticMinutes?: number | null;
  static_minutes?: number | null;

  totalMinutes?: number | null;
  total_minutes?: number | null;

  dynamicPercentage?: number | null;
  dynamic_percentage?: number | null;
}

interface KmSummary {
  id: number;
  robotId: string;
  summaryDate: string | null;
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
          <span class="page-sub">Full history - ROBOT-001</span>
        </div>
      </header>

      <div class="summary-cards" *ngIf="summaries.length > 0">

        <div class="summary-card">
          <span class="card-label">Total distance</span>
          <span class="card-value">
            {{ totalKm().toFixed(2) }}
            <span class="unit"> km</span>
          </span>
        </div>

        <div class="summary-card">
          <span class="card-label">Active days</span>
          <span class="card-value">
            {{ summaries.length }}
          </span>
        </div>

        <div class="summary-card">
          <span class="card-label">Average / day</span>
          <span class="card-value">
            {{ avgKm().toFixed(2) }}
            <span class="unit"> km</span>
          </span>
        </div>

        <div class="summary-card">
          <span class="card-label">Best day</span>
          <span class="card-value">
            {{ maxKm().toFixed(2) }}
            <span class="unit"> km</span>
          </span>
        </div>

      </div>

      <div class="panel">

        <div class="panel-header">
          <h2>Daily details</h2>
        </div>

        <div class="loading" *ngIf="loading">
          <div
            class="skeleton-row"
            *ngFor="let i of [1,2,3,4,5]"
          ></div>
        </div>

        <table
          class="km-table"
          *ngIf="!loading && summaries.length > 0"
        >

          <thead>
            <tr>
              <th>Date</th>
              <th>Distance</th>
              <th>Active</th>
              <th>Idle</th>
              <th>Total</th>
              <th>% Active</th>
            </tr>
          </thead>

          <tbody>

            <tr *ngFor="let s of summaries">

              <td class="mono">
                {{ s.summaryDate ?? '—' }}
              </td>

              <td class="mono bold">
                {{ s.distanceKm.toFixed(2) }} km
              </td>

              <td class="mono">
                {{ s.dynamicMinutes.toFixed(0) }} min
              </td>

              <td class="mono">
                {{ s.staticMinutes.toFixed(0) }} min
              </td>

              <td class="mono">
                {{ s.totalMinutes.toFixed(0) }} min
              </td>

              <td>

                <div class="pct-bar-wrap">

                  <span class="pct-bar-track">
                    <span
                      class="pct-bar"
                      [style.width.%]="s.dynamicPercentage"
                    ></span>
                  </span>

                  <span class="mono pct-label">
                    {{ s.dynamicPercentage.toFixed(0) }}%
                  </span>

                </div>

              </td>

            </tr>

          </tbody>

        </table>

        <div
          class="empty"
          *ngIf="
            !loading &&
            !loadError &&
            summaries.length === 0
          "
        >
          No data available.
        </div>

        <div
          class="empty"
          *ngIf="!loading && loadError"
        >
          <strong>Unable to load history.</strong>

          <span>
            The server did not respond
            (it may be asleep and take a few seconds to restart).
          </span>

          <button
            type="button"
            class="retry-btn"
            (click)="load()"
          >
            Retry
          </button>
        </div>

      </div>

    </div>
  `,

  styles: [
    FEATURE_PAGE_STYLES,

    `

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
      transition:
        background 0.15s ease,
        border-color 0.15s ease;
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
      background:
        linear-gradient(
          90deg,
          var(--accent-active),
          var(--accent-info)
        );
      transition:
        width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .pct-label {
      font-size: 12px;
      color: var(--text-muted);
      min-width: 32px;
    }

    `
  ],
})
export class KilometrageComponent implements OnInit {

  private http = inject(HttpClient);

  summaries: KmSummary[] = [];

  loading = true;

  loadError = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {

    this.loading = true;
    this.loadError = false;

    this.http
      .get<KmSummaryApi[]>(
        API_ORIGIN + '/api/kilometrage'
      )
      .subscribe({

        next: (data) => {

          console.log('KILOMETRAGE API RESPONSE:', data);

          this.summaries = [...data]
            .reverse()
            .map(item => this.normalizeSummary(item));

          console.log(
            'NORMALIZED KILOMETRAGE:',
            this.summaries
          );

          this.loading = false;
        },

        error: (error) => {

          console.error(
            'KILOMETRAGE API ERROR:',
            error
          );

          this.loading = false;
          this.loadError = true;
        },

      });
  }

  private normalizeSummary(
    item: KmSummaryApi
  ): KmSummary {

    let distanceKm = 0;

    if (item.distanceKm != null) {

      distanceKm = Number(item.distanceKm);

    } else if (item.distance_km != null) {

      distanceKm = Number(item.distance_km);

    } else if (item.totalDistanceKm != null) {

      distanceKm = Number(item.totalDistanceKm);

    } else if (item.total_distance_km != null) {

      distanceKm = Number(item.total_distance_km);

    } else if (item.kilometers != null) {

      distanceKm = Number(item.kilometers);

    } else if (item.km != null) {

      distanceKm = Number(item.km);

    } else if (item.distanceMeters != null) {

      distanceKm = Number(item.distanceMeters) / 1000;

    } else if (item.distance_meters != null) {

      distanceKm = Number(item.distance_meters) / 1000;

    } else if (item.distance != null) {

      distanceKm = Number(item.distance);

    }

    return {

      id: Number(item.id ?? 0),

      robotId:
        item.robotId ??
        'ROBOT-001',

      summaryDate:
        item.summaryDate ??
        null,

      distanceKm:
        Number.isFinite(distanceKm)
          ? distanceKm
          : 0,

      dynamicMinutes:
        Number(
          item.dynamicMinutes ??
          item.dynamic_minutes ??
          0
        ),

      staticMinutes:
        Number(
          item.staticMinutes ??
          item.static_minutes ??
          0
        ),

      totalMinutes:
        Number(
          item.totalMinutes ??
          item.total_minutes ??
          0
        ),

      dynamicPercentage:
        Number(
          item.dynamicPercentage ??
          item.dynamic_percentage ??
          0
        ),

    };
  }

  totalKm(): number {

    return this.summaries.reduce(
      (sum, item) =>
        sum + item.distanceKm,
      0
    );
  }

  avgKm(): number {

    return this.summaries.length
      ? this.totalKm() / this.summaries.length
      : 0;
  }

  maxKm(): number {

    return this.summaries.length
      ? Math.max(
          ...this.summaries.map(
            item => item.distanceKm
          )
        )
      : 0;
  }
}
