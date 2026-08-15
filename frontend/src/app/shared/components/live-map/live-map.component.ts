import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChargeCycle, TrajectoryPoint } from '../../models/dashboard.models';
import { getAnomalyIcon } from '../../utils/anomaly-icons';
import { LiveSimService } from '../../../core/services/live-sim.service';

export interface AnomalyMapPoint {
  type: string;
  heure: string;
  criticite?: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
}

@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="live-map-wrapper">
      <div class="live-header">
        <div class="live-dot" [class.is-idle]="!hasData"></div>
        <span class="live-label">{{ hasData ? 'LECTURE EN DIRECT' : 'PAS DE TRAJET' }}</span>
        <span class="phase-pill" *ngIf="currentPoint" [attr.data-phase]="phaseOf(currentPoint)">{{ phaseLabel(currentPoint) }}</span>
        <span class="live-progress" *ngIf="hasData">Point {{ currentIndex + 1 }} / {{ total }}</span>
      </div>
      <div #mapEl class="map-el"></div>
      <div class="live-coords" *ngIf="currentPoint">
        <span class="mono">{{ currentPoint.latitude.toFixed(6) }}, {{ currentPoint.longitude.toFixed(6) }}</span>
        <span class="mono live-heure">{{ currentPoint.heure }}</span>
      </div>
      <div class="live-empty" *ngIf="!hasData">Aucune position GPS enregistree pour cette date.</div>
    </div>
  `,
  styles: [`
    .live-map-wrapper { display: flex; flex-direction: column; gap: 8px; }
    .live-header { display: flex; align-items: center; gap: 10px; font-size: 12px; padding: 2px 0 8px; flex-wrap: wrap; }
    .live-dot { width: 8px; height: 8px; background: #E5484D; border-radius: 50%; animation: pulse 1.2s infinite; flex-shrink: 0; }
    .live-dot.is-idle { background: var(--text-muted); animation: none; }
    @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
    .live-label { font-weight: 700; color: #E5484D; font-family: var(--font-mono); font-size: 11px; letter-spacing: .05em; }
    .live-dot.is-idle + .live-label { color: var(--text-muted); }
    .live-mission { color: #3DDC97; font-family: var(--font-mono); }
    .phase-pill {
      font-family: var(--font-mono);
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--panel-raised);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
    }
    .phase-pill[data-phase='dock'] { color: #B8790C; background: rgba(233, 190, 135, 0.28); border-color: rgba(233, 190, 135, 0.5); }
    .phase-pill[data-phase='home'] { color: #CA5215; background: rgba(202, 82, 21, 0.14); border-color: rgba(202, 82, 21, 0.35); }
    .phase-pill[data-phase='patrol'] { color: var(--accent-primary); background: var(--accent-primary-soft); border-color: transparent; }
    .phase-pill[data-phase='teleop'] { color: #E5484D; background: rgba(229, 72, 77, 0.14); border-color: rgba(229, 72, 77, 0.35); }
    .live-progress { color: var(--text-muted); font-size: 11px; margin-left: auto; }
    .map-el { height: 280px; border-radius: 8px; overflow: hidden; background: var(--panel-raised); }
    .live-coords { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
    .mono { font-family: var(--font-mono); color: var(--text-secondary); }
    .live-heure { color: var(--text-muted); }
    .live-empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 10px 0; }
  `],
})
export class LiveMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() trajectory: TrajectoryPoint[] = [];
  @Input() chargeCycles: ChargeCycle[] = [];

  @Input() anomalies: AnomalyMapPoint[] = [];

  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private liveSim = inject(LiveSimService);

  currentIndex = 0;
  total = 0;
  currentPoint: TrajectoryPoint | null = null;
  hasData = false;

  private readonly PLAYBACK_SPEED = 8;
  private readonly MIN_STEP_MS = 1800;
  private readonly MAX_STEP_MS = 10000;

  private map: any = null;
  private L: any = null;
  private robotMarker: any = null;
  private segmentLines: any[] = [];
  private phaseLabelLayers: any[] = [];

  private revealedSegments = new Set<number>();
  private revealedAnomalyIdx = new Set<number>();

  private segmentGeometries: [number, number][][] = [];
  private chargeMarkers: any[] = [];
  private anomalyMarkers: any[] = [];
  private mapReady = false;
  private viewInitialized = false;

  private routeRequestToken = 0;

  private livePoints: TrajectoryPoint[] = [];
  private lastFirstPointKey = '';

  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    if (!isPlatformBrowser(this.platformId)) return;
    this.initMap().then(() => {
      this.mapReady = true;
      this.applyTrajectory();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewInitialized) return;
    if (changes['trajectory'] || changes['chargeCycles'] || changes['anomalies']) {
      this.applyTrajectory();
    }
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
    if (this.map) {
      this.anomalyMarkers.forEach((m) => this.map.removeLayer(m));
      this.anomalyMarkers = [];
      this.map.stop();
      this.map.remove();
      this.map = null;
    }
  }

  private async initMap(): Promise<void> {
    if (!this.mapEl) return;
    const leafletModule = (await import('leaflet')) as any;

    this.L = leafletModule.default ?? leafletModule;
    const L = this.L;
    const container = this.mapEl.nativeElement;

    this.map = L.map(container, { zoomControl: true, attributionControl: false }).setView(
      [35.8176, 10.5913],
      16,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(this.map);
  }

  private applyTrajectory(): void {
    const requestToken = ++this.routeRequestToken;

    const points = this.deduplicatePoints(
      (this.trajectory ?? []).filter((p) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
    );
    this.total = points.length;
    this.hasData = points.length > 0;

    this.renderChargeMarkers();
    this.renderAnomalyMarkers();

    if (!this.mapReady || !this.map || !this.L) {
      return;
    }

    const L = this.L;

    if (!this.hasData) {
      this.cancelAnimation();
      this.clearSegmentLines();
      this.currentIndex = 0;
      this.currentPoint = null;
      this.livePoints = [];
      if (this.robotMarker) {
        this.map.removeLayer(this.robotMarker);
        this.robotMarker = null;
      }
      this.liveSim.reset();
      return;
    }

    const firstPointKey = `${points[0].latitude},${points[0].longitude},${points[0].heure}`;
    const isNewDataset = firstPointKey !== this.lastFirstPointKey || points.length < this.livePoints.length;
    this.lastFirstPointKey = firstPointKey;

    const previousLength = this.livePoints.length;
    this.livePoints = points;

    const allLatLngs = points.map((p) => [p.latitude, p.longitude] as [number, number]);

    if (isNewDataset) {
      this.cancelAnimation();
      this.clearSegmentLines();
      this.revealedSegments.clear();
      this.revealedAnomalyIdx.clear();

      const startIdx = 0;
      this.currentIndex = startIdx;
      this.currentPoint = points[startIdx];

      this.segmentGeometries = points.slice(0, -1).map((p, i) => [
        [p.latitude, p.longitude],
        [points[i + 1].latitude, points[i + 1].longitude],
      ] as [number, number][]);
      this.drawSegmentLines(points);
      this.renderAnomalyMarkers();

      this.map.stop();
      this.map.fitBounds(L.latLngBounds(allLatLngs), { padding: [30, 30] });

      const lastLatLng = allLatLngs[startIdx];
      if (!this.robotMarker) {
        const robotIcon = L.divIcon({
          className: 'robot-marker-wrapper',
          html: `
            <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">

              <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:radial-gradient(circle,rgba(45,116,201,0.4) 0%,rgba(45,116,201,0) 70%);animation:robotHalo 2s ease-out infinite;"></div>

              <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#3B82D6 0%,#2468B5 100%);border:3px solid #fff;box-shadow:0 0 0 2px #0B1B2D,0 4px 12px rgba(36,104,181,.4);display:flex;align-items:center;justify-content:center;position:relative;z-index:2;">

                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="9" y1="7" x2="15" y2="7"></line><circle cx="12" cy="16" r="2"></circle></svg>
              </div>

              <div style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);background:rgba(6,16,29,0.9);border:1px solid rgba(45,116,201,0.4);border-radius:4px;padding:2px 8px;color:#3B82D6;font-size:8px;font-weight:700;white-space:nowrap;letter-spacing:0.05em;z-index:1;backdrop-filter:blur(4px);" id="robot-status-label">PATROUILLE</div>
            </div>
            <style>
              @keyframes robotHalo {
                0% { transform:scale(1);opacity:1; }
                100% { transform:scale(1.8);opacity:0; }
              }
            </style>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        this.robotMarker = L.marker(lastLatLng, { icon: robotIcon, zIndexOffset: 1000 }).addTo(this.map);
      } else {
        this.robotMarker.setLatLng(lastLatLng);
      }
      this.updatePopup(points[startIdx]);
      this.liveSim.reportProgress(startIdx, 0, this.phaseOf(points[startIdx]));

      if (points.length > 1) {
        this.animateToNextPoint();
      }

      this.fetchRoadSnappedSegments(points).then((snapped) => {
        if (requestToken !== this.routeRequestToken) return;
        this.segmentGeometries = snapped;
        this.drawSegmentLines(this.livePoints);
      });
    } else if (points.length > previousLength) {

      for (let i = previousLength - 1; i < points.length - 1; i++) {
        if (i < 0) continue;
        this.segmentGeometries[i] = [
          [points[i].latitude, points[i].longitude],
          [points[i + 1].latitude, points[i + 1].longitude],
        ];
      }
      this.drawSegmentLines(points);

      const newTail = points.slice(Math.max(0, previousLength - 1));
      this.fetchRoadSnappedSegments(newTail).then((snapped) => {
        if (requestToken !== this.routeRequestToken) return;
        const offset = Math.max(0, previousLength - 1);
        snapped.forEach((seg, i) => {
          this.segmentGeometries[offset + i] = seg;
        });
        this.drawSegmentLines(this.livePoints);
      });

      if (this.animationFrameId === null) {

        this.animateToNextPoint();
      }
    }
  }

  private clearSegmentLines(): void {
    if (this.map) {
      this.segmentLines.forEach((line) => this.map.removeLayer(line));
      this.phaseLabelLayers.forEach((label) => this.map.removeLayer(label));
    }
    this.segmentLines = [];
    this.phaseLabelLayers = [];
  }

  private drawSegmentLines(points: TrajectoryPoint[]): void {
    if (!this.map || !this.L) return;
    const L = this.L;
    this.clearSegmentLines();

    this.segmentGeometries.forEach((coords, i) => {
      const phase = this.phaseOf(points[i + 1]);
      const color = this.phaseColor(points[i + 1]);
      const traveled = this.revealedSegments.has(i);

      if (!traveled) return;

      const shadowLine = L.polyline(coords, {
        color: color,
        weight: 8,
        opacity: 0.2,
        dashArray: phase === 'dock' ? '2 8' : undefined,
        lineCap: 'round',
      }).addTo(this.map);
      this.segmentLines.push(shadowLine);

      const line = L.polyline(coords, {
        color,
        weight: 5,
        opacity: 1,
        dashArray: phase === 'dock' ? '2 8' : undefined,
        lineCap: 'round',
      }).addTo(this.map);
      this.segmentLines.push(line);

      const previousPhase = i > 0 ? this.phaseOf(points[i]) : null;
      if ((phase === 'dock' || phase === 'home') && phase !== previousPhase) {
        const mid = coords[Math.floor(coords.length / 2)] ?? coords[0];
        const text = phase === 'dock' ? 'Vers la station · charge' : 'Retour a la base';
        const tooltip = L.tooltip({
          permanent: true,
          direction: 'top',
          className: `route-phase-label route-phase-${phase}`,
          offset: [0, -4],
        })
          .setLatLng(mid)
          .setContent(text)
          .addTo(this.map);
        this.phaseLabelLayers.push(tooltip);
      }
    });
  }

  private async fetchRoadSnappedSegments(points: TrajectoryPoint[]): Promise<[number, number][][]> {
    const straight = points.slice(0, -1).map((p, i) => [
      [p.latitude, p.longitude],
      [points[i + 1].latitude, points[i + 1].longitude],
    ] as [number, number][]);

    if (points.length < 2) return straight;

    const CHUNK = 24;
    const result = [...straight];

    for (let start = 0; start < points.length - 1; start += CHUNK) {
      const end = Math.min(start + CHUNK + 1, points.length);
      const chunk = points.slice(start, end);
      if (chunk.length < 2) continue;

      try {
        const coordsParam = chunk.map((p) => `${p.longitude},${p.latitude}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/foot/${coordsParam}?geometries=geojson&overview=full&steps=true`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        const legs = data?.routes?.[0]?.legs;
        if (!Array.isArray(legs)) continue;

        legs.forEach((leg: any, legIdx: number) => {
          const globalIdx = start + legIdx;
          const stepCoords: [number, number][] = [];
          (leg?.steps ?? []).forEach((step: any) => {
            const coords = step?.geometry?.coordinates;
            if (Array.isArray(coords)) {
              coords.forEach((c: [number, number]) => stepCoords.push([c[1], c[0]]));
            }
          });
          if (stepCoords.length >= 2) {
            result[globalIdx] = stepCoords;
          }
        });
      } catch {

      }
    }

    return result;
  }

  private animateToNextPoint(): void {
    const points = this.livePoints;
    if (points.length < 2) return;

    const fromIdx = this.currentIndex;
    const toIdx = (this.currentIndex + 1) % points.length;
    const from = points[fromIdx];
    const to = points[toIdx];

    if (toIdx === 0 && fromIdx !== 0) {

      this.updateRobotStatusLabel('done');
      return;
    }

    const durationMs = this.stepDelayMs(from, to);
    const startTime = performance.now();

    const path: [number, number][] = (fromIdx < toIdx && this.segmentGeometries[fromIdx]?.length >= 2)
      ? this.segmentGeometries[fromIdx]
      : [[from.latitude, from.longitude], [to.latitude, to.longitude]];
    const cumulative = this.cumulativeDistances(path);
    const totalDist = cumulative[cumulative.length - 1] || 1;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);

      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const [lat, lng] = this.pointAlongPath(path, cumulative, totalDist * eased);
      this.robotMarker?.setLatLng([lat, lng]);
      this.updateRobotStatusLabel(this.phaseOf(to));
      try {
        this.liveSim.reportProgress(fromIdx, eased, this.phaseOf(to));
      } catch {

      }

      if (t < 1) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.currentIndex = toIdx;
        this.currentPoint = to;
        this.revealedSegments.add(fromIdx);

        this.drawSegmentLines(this.livePoints);
        this.renderAnomalyMarkers();

        this.updatePopup(to);
        this.map?.panTo([to.latitude, to.longitude], { animate: true, duration: 0.6 });

        this.animateToNextPoint();
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  private cumulativeDistances(path: [number, number][]): number[] {
    const cumulative = [0];
    for (let i = 1; i < path.length; i++) {
      const [lat1, lng1] = path[i - 1];
      const [lat2, lng2] = path[i];
      const d = Math.hypot(lat2 - lat1, lng2 - lng1);
      cumulative.push(cumulative[i - 1] + d);
    }
    return cumulative;
  }

  private pointAlongPath(path: [number, number][], cumulative: number[], targetDist: number): [number, number] {
    if (path.length === 1) return path[0];
    let i = 1;
    while (i < cumulative.length && cumulative[i] < targetDist) i++;
    i = Math.min(i, path.length - 1);
    const segStart = cumulative[i - 1];
    const segLen = cumulative[i] - segStart || 1;
    const segT = Math.min(1, Math.max(0, (targetDist - segStart) / segLen));
    const [lat1, lng1] = path[i - 1];
    const [lat2, lng2] = path[i];
    return [lat1 + (lat2 - lat1) * segT, lng1 + (lng2 - lng1) * segT];
  }

  private updatePopup(pt: TrajectoryPoint): void {
    if (!this.robotMarker) return;
    const detail = pt.detail ? '<br>' + pt.detail : '';
    this.robotMarker.bindPopup(
      '<b>' + pt.source + '</b><br>' + pt.label + detail + '<br><small>' + pt.heure + '</small>',
    );
  }

  private updateRobotStatusLabel(phase: string): void {
    if (!this.robotMarker) return;
    const statusMap: { [key: string]: string } = {
      'patrol': 'PATROL',
      'dock': 'STATION',
      'home': 'BASE',
      'inspect': 'INSPECTION',
      'teleop': 'TELEOP',
      'charge': 'CHARGING',
      'done': 'DAY COMPLETE',
    };
    const status = statusMap[phase] || phase.toUpperCase();
    const container = this.robotMarker.getElement();
    if (container) {
      const label = container.querySelector('#robot-status-label');
      if (label) {
        label.textContent = status;
      }
    }
  }

  private renderAnomalyMarkers(): void {
    if (!this.map || !this.L) return;
    this.anomalyMarkers.forEach((m) => this.map.removeLayer(m));
    this.anomalyMarkers = [];

    const L = this.L;
    const nowSec = this.toSeconds(this.currentPoint?.heure ?? undefined);
    (this.anomalies ?? []).forEach((a, idx) => {
      if (a.latitude == null || a.longitude == null || !Number.isFinite(a.latitude) || !Number.isFinite(a.longitude)) {
        return;
      }

      const anomalySec = this.toSeconds(a.heure);
      if (!this.revealedAnomalyIdx.has(idx)) {

        if (nowSec == null || (anomalySec != null && anomalySec > nowSec)) {
          return;
        }
        this.revealedAnomalyIdx.add(idx);
      }

      const icon = L.divIcon({
        className: '',
        html:
          '<div style="width:14px;height:14px;background:#E5484D;border-radius:3px;transform:rotate(45deg);' +
          'border:2px solid #fff;box-shadow:0 0 0 4px rgba(229,72,77,.25),0 2px 6px rgba(0,0,0,.5);' +
          'animation:liveAnomalyPulse 1.4s infinite;"></div>' +
          '<style>@keyframes liveAnomalyPulse{0%,100%{box-shadow:0 0 0 4px rgba(229,72,77,.25),0 2px 6px rgba(0,0,0,.5);}' +
          '50%{box-shadow:0 0 0 9px rgba(229,72,77,.08),0 2px 6px rgba(0,0,0,.5);}}</style>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const imgTag = a.imageUrl
        ? `<br><img src="${a.imageUrl}" alt="${a.type}" style="width:160px;max-width:100%;border-radius:6px;margin-top:6px;display:block;">`
        : `<br><div style="width:48px;height:48px;margin-top:6px;color:#8a97a3;display:flex;align-items:center;justify-content:center;">${getAnomalyIcon(a.type)}</div>`;
      const criticiteTag = a.criticite ? ` <small style="opacity:.7">(${a.criticite})</small>` : '';

      const marker = L.marker([a.latitude, a.longitude], { icon, zIndexOffset: 900 }).bindPopup(
        `<b>${a.type}</b>${criticiteTag}<br><small>${a.heure}</small>${imgTag}`,
        { maxWidth: 200 },
      );
      marker.addTo(this.map);
      this.anomalyMarkers.push(marker);
    });
  }

  private renderChargeMarkers(): void {
    if (!this.map || !this.L) return;
    this.chargeMarkers.forEach((m) => this.map.removeLayer(m));
    this.chargeMarkers = [];

    const L = this.L;
    (this.chargeCycles ?? []).forEach((c) => {
      if (c.stationLatitude == null || c.stationLongitude == null) return;
      const icon = L.divIcon({
        className: '',
        html:
          '<div style="width:16px;height:16px;background:#E9BE87;border-radius:50%;border:3px solid #fff;' +
          'box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const marker = L.marker([c.stationLatitude, c.stationLongitude], { icon }).bindPopup(
        '<b>Station de charge</b><br>' + c.dockHeure,
      );
      marker.addTo(this.map);
      this.chargeMarkers.push(marker);
    });
  }

  private deduplicatePoints(points: TrajectoryPoint[]): TrajectoryPoint[] {
    const result: TrajectoryPoint[] = [];
    points.forEach((point, index) => {
      if (!point) return;
      if (index === 0) {
        result.push(point);
        return;
      }
      const previous = result[result.length - 1];
      const sameLocation = Math.abs(point.latitude - previous.latitude) < 1e-6 && Math.abs(point.longitude - previous.longitude) < 1e-6;
      const sameContext = point.heure === previous.heure && point.source === previous.source && point.label === previous.label;
      if (!sameLocation || !sameContext) {
        result.push(point);
      }
    });
    return result;
  }

  private stepDelayMs(from: TrajectoryPoint, to: TrajectoryPoint): number {
    const fromSec = this.toSeconds(from?.heure);
    const toSec = this.toSeconds(to?.heure);

    if (fromSec == null || toSec == null) {
      return this.MIN_STEP_MS;
    }

    let diffSeconds = toSec - fromSec;
    if (diffSeconds < 0) {
      diffSeconds += 24 * 3600;
    }

    const delay = (diffSeconds * 1000) / this.PLAYBACK_SPEED;
    return Math.min(this.MAX_STEP_MS, Math.max(this.MIN_STEP_MS, delay));
  }

  private toSeconds(heure?: string): number | null {
    if (!heure) return null;
    const parts = heure.split(':').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  private cancelAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  phaseOf(pt: TrajectoryPoint): 'dock' | 'home' | 'teleop' | 'patrol' {
    const s = (pt.source || '').toLowerCase();
    if (s.includes('docking')) return 'dock';
    if (s.includes('retour')) return 'home';
    if (s.includes('teleop') || s.includes('télé')) return 'teleop';
    return 'patrol';
  }

  phaseLabel(pt: TrajectoryPoint): string {
    switch (this.phaseOf(pt)) {
      case 'dock': return 'Vers la station · charge';
      case 'home': return 'Retour a la base';
      case 'teleop': return 'Teleoperation';
      default: return 'Ronde en cours';
    }
  }

  private phaseColor(pt: TrajectoryPoint): string {
    switch (this.phaseOf(pt)) {
      case 'dock': return '#E9BE87';
      case 'home': return '#CA5215';
      case 'teleop': return '#E5484D';
      default: return '#2468B5';
    }
  }
}
