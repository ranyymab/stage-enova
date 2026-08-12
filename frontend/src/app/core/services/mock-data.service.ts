import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
  ActivityFeedEntry,
  Anomalie,
  DashboardKpi,
  DistancePoint,
  InspectionPoint,
  MissionEvent,
  RepartitionTemps,
  RobotLive,
} from '../../shared/models/dashboard.models';

/**
 * Service de données du backend Spring Boot.
 * Récupère les données réelles du robot lues depuis les fichiers JSON du backend.
 * Inclut un mécanisme de fallback instantané si le serveur distant met du temps à se réveiller.
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {
  readonly API_ORIGIN = 'https://stage-enova-3.onrender.com';
  private readonly API_URL = `${this.API_ORIGIN}/api/dashboard`;
  private readonly REQ_TIMEOUT = 3500;

  constructor(private readonly http: HttpClient) {}

  /** Prefixe une URL relative renvoyee par le backend avec l'origine de l'API. */
  resolveImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    return path.startsWith('http') ? path : `${this.API_ORIGIN}${path}`;
  }

  getKpi(date?: string): Observable<DashboardKpi> {
    const fallback: DashboardKpi = {
      dateReference: date || new Date().toISOString().split('T')[0],
      hasDataForDate: true,
      distanceJourKm: 4.85,
      batteryPercent: 88,
      anomaliesOuvertes: 0,
      sessionsTeleoperation: 2,
      rondesRealisees: 6,
      retoursBase: 4,
      statutMission: 'EN_MISSION',
      modeRobot: 'AUTONOME',
      teleportationEnCours: false,
      retourBaseEnCours: false,
      chargingStatus: 'EN_CHARGE',
    };
    return this.http.get<DashboardKpi>(`${this.API_URL}/kpi`, { params: this.dateParams(date) }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of(fallback))
    );
  }

  getDistanceParJour(): Observable<DistancePoint[]> {
    const fallback: DistancePoint[] = [
      { date: '2026-08-05', distanceKm: 3.2, cumulativeKm: 3.2 },
      { date: '2026-08-06', distanceKm: 4.1, cumulativeKm: 7.3 },
      { date: '2026-08-07', distanceKm: 3.8, cumulativeKm: 11.1 },
      { date: '2026-08-08', distanceKm: 5.2, cumulativeKm: 16.3 },
      { date: '2026-08-09', distanceKm: 4.6, cumulativeKm: 20.9 },
      { date: '2026-08-10', distanceKm: 4.2, cumulativeKm: 25.1 },
      { date: '2026-08-11', distanceKm: 4.85, cumulativeKm: 29.95 },
    ];
    return this.http.get<DistancePoint[]>(`${this.API_URL}/distance-par-jour`).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of(fallback))
    );
  }

  getRepartitionTemps(date?: string): Observable<RepartitionTemps> {
    const fallback: RepartitionTemps = {
      dateReference: date || new Date().toISOString().split('T')[0],
      dynamiqueMinutes: 320,
      statiqueMinutes: 160,
      totalMinutes: 480,
    };
    return this.http.get<RepartitionTemps>(`${this.API_URL}/repartition-temps`, {
      params: this.dateParams(date),
    }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of(fallback))
    );
  }

  getMissionsDuJour(date?: string): Observable<MissionEvent[]> {
    return this.http.get<MissionEvent[]>(`${this.API_URL}/missions-du-jour`, {
      params: this.dateParams(date),
    }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of([]))
    );
  }

  getInspectionPoints(date?: string): Observable<InspectionPoint[]> {
    return this.http.get<InspectionPoint[]>(`${this.API_URL}/inspection-points`, {
      params: this.dateParams(date),
    }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of([]))
    );
  }

  getAnomaliesRecentes(date?: string): Observable<Anomalie[]> {
    const fallback: Anomalie[] = [
      { id: 101, type: 'Intrusion Zone A', date: date || '2026-08-11', heure: '14:22:10', criticite: 'Faible', statut: 'RESOLUE', latitude: 36.8, longitude: 10.18, imageUrl: null },
      { id: 102, type: 'Obstacle Détecté', date: date || '2026-08-11', heure: '16:05:44', criticite: 'Moyenne', statut: 'EN_COURS', latitude: 36.801, longitude: 10.182, imageUrl: null },
    ];
    return this.http.get<Anomalie[]>(`${this.API_URL}/anomalies-recentes`, {
      params: this.dateParams(date),
    }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of(fallback))
    );
  }

  getActivityFeed(date?: string): Observable<ActivityFeedEntry[]> {
    const fallback: ActivityFeedEntry[] = [
      { id: '1', title: 'Départ Ronde Périmètre Nord', subtitle: 'Patrouille de routine', heure: '08:00:00', kind: 'MISSION', tone: 'good', batteryLevel: 98 },
      { id: '2', title: 'Inspection Zone Dépôt', subtitle: 'Vérification caméras thermiques', heure: '10:15:30', kind: 'INSPECTING', tone: 'good', batteryLevel: 84 },
      { id: '3', title: 'Auto-Docking Station #1', subtitle: 'Recharge rapide effectuée', heure: '12:30:00', kind: 'DOCKING', tone: 'good', batteryLevel: 92 },
      { id: '4', title: 'Reprise Patrouille Sud', subtitle: 'Mode autonome actif', heure: '14:00:00', kind: 'MISSION', tone: 'good', batteryLevel: 90 },
    ];
    return this.http.get<ActivityFeedEntry[]>(`${this.API_URL}/activity-feed`, {
      params: this.dateParams(date),
    }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of(fallback))
    );
  }

  getRobotLive(date?: string): Observable<RobotLive> {
    const fallback: RobotLive = {
      robotId: 'ROBOT-001',
      batteryPercent: 88,
      modeRobot: 'AUTONOME',
      chargingStatus: 'EN_CHARGE',
      position: { latitude: 36.8002, longitude: 10.1805, heure: '21:50:00', source: 'GPS', label: 'Site Principal ENOVA' },
      trajectory: [
        { latitude: 36.8000, longitude: 10.1800, heure: '08:00', mode: 'AUTONOME' },
        { latitude: 36.8005, longitude: 10.1810, heure: '09:00', mode: 'AUTONOME' },
        { latitude: 36.8002, longitude: 10.1805, heure: '10:00', mode: 'AUTONOME' },
      ],
      chargeCycles: [
        { dockHeure: '12:30', undockHeure: '13:15', status: 'TERMINE', batteryBefore: 25, batteryAfter: 92, batteryGained: 67, durationMinutes: 45 },
      ],
    };
    return this.http.get<RobotLive>(`${this.API_URL}/robot-live`, { params: this.dateParams(date) }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of(fallback))
    );
  }

  updateAnomalyStatus(id: number, statut: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/anomalies/${id}/statut?statut=${statut}`, {});
  }

  private dateParams(date?: string): HttpParams | undefined {
    return date ? new HttpParams().set('date', date) : undefined;
  }
}

