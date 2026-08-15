import { Injectable, signal } from '@angular/core';
import { TrajectoryPoint, ChargeCycle, MissionEvent, Anomalie } from '../../shared/models/dashboard.models';

export type LiveSimPhase = 'patrol' | 'dock' | 'home' | 'teleop';

export interface LiveSimState {

  ready: boolean;
  pointIndex: number;

  distanceKm: number;

  batteryPercent: number;
  phase: LiveSimPhase;

  roundsCount: number;

  anomaliesCount: number;

  nowSeconds: number;
}

interface BatteryAnchor {
  seconds: number;
  battery: number;
}

const EMPTY_STATE: LiveSimState = {
  ready: false,
  pointIndex: 0,
  distanceKm: 0,
  batteryPercent: 0,
  phase: 'patrol',
  roundsCount: 0,
  anomaliesCount: 0,
  nowSeconds: 0,
};

@Injectable({ providedIn: 'root' })
export class LiveSimService {
  readonly state = signal<LiveSimState>(EMPTY_STATE);

  private points: TrajectoryPoint[] = [];
  private segDistKm: number[] = [];
  private cumDistKm: number[] = [0];
  private batteryAnchors: BatteryAnchor[] = [];
  private missionSeconds: number[] = [];
  private anomalySeconds: number[] = [];

  private lastFingerprint: string | null = null;

  initDay(opts: {
    trajectory: TrajectoryPoint[];
    chargeCycles: ChargeCycle[];
    missions: MissionEvent[];
    anomalies: Anomalie[];
    finalBatteryPercent: number;
  }): void {
    const fingerprint = this.fingerprintOf(opts.trajectory);
    const isSameDay = fingerprint !== null && fingerprint === this.lastFingerprint;
    this.lastFingerprint = fingerprint;

    const points = this.dedup(
      (opts.trajectory ?? []).filter((p) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
    );

    if (!isSameDay) {
      this.points = points;
      this.segDistKm = [];
      this.cumDistKm = [0];
      for (let i = 1; i < this.points.length; i++) {
        const d = this.haversineKm(this.points[i - 1], this.points[i]);
        this.segDistKm.push(d);
        this.cumDistKm.push(this.cumDistKm[i - 1] + d);
      }
    } else if (points.length > this.points.length) {

      const previousLength = this.points.length;
      this.points = points;
      for (let i = previousLength; i < this.points.length; i++) {
        const d = this.haversineKm(this.points[i - 1], this.points[i]);
        this.segDistKm.push(d);
        this.cumDistKm.push(this.cumDistKm[i - 1] + d);
      }
    }

    this.batteryAnchors = this.buildBatteryAnchors(opts.chargeCycles, opts.finalBatteryPercent);
    this.missionSeconds = (opts.missions ?? [])
      .map((m) => this.toSeconds(m.heure))
      .filter((s): s is number => s != null)
      .sort((a, b) => a - b);
    this.anomalySeconds = (opts.anomalies ?? [])
      .map((a) => this.toSeconds(a.heure))
      .filter((s): s is number => s != null)
      .sort((a, b) => a - b);

    if (isSameDay) return;

    if (this.points.length < 2) {
      this.state.set({ ...EMPTY_STATE, batteryPercent: opts.finalBatteryPercent });
      return;
    }

    this.state.set({
      ready: true,
      pointIndex: 0,
      distanceKm: 0,
      batteryPercent: this.batteryAnchors[0]?.battery ?? opts.finalBatteryPercent,
      phase: 'patrol',
      roundsCount: 0,
      anomaliesCount: 0,
      nowSeconds: this.toSeconds(this.points[0]?.heure) ?? 0,
    });
  }

  private fingerprintOf(trajectory: TrajectoryPoint[]): string | null {
    if (!trajectory || trajectory.length === 0) return null;

    const first = trajectory[0];
    return `${first?.heure}|${first?.latitude}|${first?.longitude}`;
  }

  reportProgress(pointIndex: number, segmentFraction: number, phase: LiveSimPhase): void {
    if (this.points.length < 2) return;

    const idx = Math.max(0, Math.min(pointIndex, this.points.length - 2));
    const frac = Math.max(0, Math.min(1, segmentFraction));
    const segLen = this.segDistKm[idx] ?? 0;
    const distanceKm = (this.cumDistKm[idx] ?? 0) + segLen * frac;

    const fromSec = this.toSeconds(this.points[idx]?.heure);
    const toSec = this.toSeconds(this.points[idx + 1]?.heure);
    let nowSec = fromSec ?? 0;
    if (fromSec != null && toSec != null) {
      let diff = toSec - fromSec;
      if (diff < 0) diff += 24 * 3600;
      nowSec = fromSec + diff * frac;
    }

    this.state.set({
      ready: true,
      pointIndex: idx,
      distanceKm,
      batteryPercent: this.interpolateBattery(nowSec),
      phase,
      roundsCount: this.countReached(this.missionSeconds, nowSec),
      anomaliesCount: this.countReached(this.anomalySeconds, nowSec),
      nowSeconds: nowSec,
    });
  }

  reset(): void {
    this.points = [];
    this.lastFingerprint = null;
    this.state.set(EMPTY_STATE);
  }

  private buildBatteryAnchors(chargeCycles: ChargeCycle[], finalBatteryPercent: number): BatteryAnchor[] {
    const CEILING = 92;
    const anchors: BatteryAnchor[] = [];
    for (const c of chargeCycles ?? []) {
      const dockSec = this.toSeconds(c.dockHeure);
      const undockSec = this.toSeconds(c.undockHeure);
      if (dockSec != null && c.batteryBefore != null) anchors.push({ seconds: dockSec, battery: c.batteryBefore });
      if (undockSec != null && c.batteryAfter != null) anchors.push({ seconds: undockSec, battery: c.batteryAfter });
    }
    anchors.sort((a, b) => a.seconds - b.seconds);

    const firstSec = this.toSeconds(this.points[0]?.heure) ?? 0;
    const lastSec = this.toSeconds(this.points[this.points.length - 1]?.heure) ?? firstSec;

    if (anchors.length === 0) {

      return [
        { seconds: firstSec, battery: CEILING },
        { seconds: lastSec, battery: finalBatteryPercent },
      ];
    }
    if (anchors[0].seconds > firstSec) {
      anchors.unshift({ seconds: firstSec, battery: CEILING });
    }
    if (anchors[anchors.length - 1].seconds < lastSec) {
      anchors.push({ seconds: lastSec, battery: finalBatteryPercent });
    }
    return anchors;
  }

  private interpolateBattery(nowSec: number): number {
    const anchors = this.batteryAnchors;
    if (anchors.length === 0) return 0;
    if (nowSec <= anchors[0].seconds) return anchors[0].battery;

    for (let i = 1; i < anchors.length; i++) {
      if (nowSec <= anchors[i].seconds) {
        const span = anchors[i].seconds - anchors[i - 1].seconds || 1;
        const t = (nowSec - anchors[i - 1].seconds) / span;
        return anchors[i - 1].battery + (anchors[i].battery - anchors[i - 1].battery) * t;
      }
    }
    return anchors[anchors.length - 1].battery;
  }

  private countReached(sortedSeconds: number[], nowSec: number): number {
    let count = 0;
    for (const s of sortedSeconds) {
      if (s <= nowSec) count++;
      else break;
    }
    return count;
  }

  private haversineKm(a: TrajectoryPoint, b: TrajectoryPoint): number {
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const lat1 = (a.latitude * Math.PI) / 180;
    const lat2 = (b.latitude * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toSeconds(heure?: string | null): number | null {
    if (!heure) return null;
    const parts = heure.split(':').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  private dedup(points: TrajectoryPoint[]): TrajectoryPoint[] {
    const result: TrajectoryPoint[] = [];
    points.forEach((point, index) => {
      if (!point) return;
      if (index === 0) {
        result.push(point);
        return;
      }
      const previous = result[result.length - 1];
      const sameLocation =
        Math.abs(point.latitude - previous.latitude) < 1e-6 && Math.abs(point.longitude - previous.longitude) < 1e-6;
      const sameContext = point.heure === previous.heure && point.source === previous.source && point.label === previous.label;
      if (!sameLocation || !sameContext) result.push(point);
    });
    return result;
  }
}
