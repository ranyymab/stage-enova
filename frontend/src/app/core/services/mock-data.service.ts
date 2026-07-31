import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {
  readonly API_ORIGIN = 'https://stage-enova-3.onrender.com';
  private readonly API_URL = `${this.API_ORIGIN}/api/dashboard`;

  constructor(private readonly http: HttpClient) {}

  /** Prefixe une URL relative renvoyee par le backend (ex: "/images/detections/1.jpg") avec l'origine de l'API. */
  resolveImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    return path.startsWith('http') ? path : `${this.API_ORIGIN}${path}`;
  }

  getKpi(date?: string): Observable<DashboardKpi> {
    return this.http.get<DashboardKpi>(`${this.API_URL}/kpi`, { params: this.dateParams(date) });
  }

  getDistanceParJour(): Observable<DistancePoint[]> {
    return this.http.get<DistancePoint[]>(`${this.API_URL}/distance-par-jour`);
  }

  getRepartitionTemps(date?: string): Observable<RepartitionTemps> {
    return this.http.get<RepartitionTemps>(`${this.API_URL}/repartition-temps`, {
      params: this.dateParams(date),
    });
  }

  getMissionsDuJour(date?: string): Observable<MissionEvent[]> {
    return this.http.get<MissionEvent[]>(`${this.API_URL}/missions-du-jour`, {
      params: this.dateParams(date),
    });
  }

  getInspectionPoints(date?: string): Observable<InspectionPoint[]> {
    return this.http.get<InspectionPoint[]>(`${this.API_URL}/inspection-points`, {
      params: this.dateParams(date),
    });
  }

  getAnomaliesRecentes(date?: string): Observable<Anomalie[]> {
    return this.http.get<Anomalie[]>(`${this.API_URL}/anomalies-recentes`, {
      params: this.dateParams(date),
    });
  }

  getActivityFeed(date?: string): Observable<ActivityFeedEntry[]> {
    return this.http.get<ActivityFeedEntry[]>(`${this.API_URL}/activity-feed`, {
      params: this.dateParams(date),
    });
  }

  getRobotLive(date?: string): Observable<RobotLive> {
    return this.http.get<RobotLive>(`${this.API_URL}/robot-live`, { params: this.dateParams(date) });
  }

  updateAnomalyStatus(id: number, statut: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/anomalies/${id}/statut?statut=${statut}`, {});
  }

  private dateParams(date?: string): HttpParams | undefined {
    return date ? new HttpParams().set('date', date) : undefined;
  }
}
