import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
  ActivityFeedEntry,
  Anomalie,
  Criticite,
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
      derniereMiseAJour: new Date().toISOString(),
      derniereDateAvecDonnees: date || new Date().toISOString().split('T')[0],
      hasDataForDate: true,
      distanceJourKm: 13.4,
      batteryPercent: 78,
      anomaliesOuvertes: 1,
      sessionsTeleoperation: 2,
      rondesRealisees: 6,
      retoursBase: 4,
      statutMission: 'EN_MISSION',
      missionEnCours: null,
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
    const d = date || '2026-08-11';
    const fallback = this.buildFallbackDay(d).anomalies;
    // La derniere anomalie de la journee reste ouverte, pour que le badge/compteur ait du sens.
    if (fallback.length > 0) fallback[fallback.length - 1].statut = 'EN_COURS';
    return this.http.get<Anomalie[]>(`${this.API_URL}/anomalies-recentes`, {
      params: this.dateParams(date),
    }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of(fallback))
    );
  }

  getActivityFeed(date?: string): Observable<ActivityFeedEntry[]> {
    const d = date || '2026-08-11';
    const fallback = this.buildFallbackDay(d).activity;
    return this.http.get<ActivityFeedEntry[]>(`${this.API_URL}/activity-feed`, {
      params: this.dateParams(date),
    }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of(fallback))
    );
  }

  getRobotLive(date?: string): Observable<RobotLive> {
    const d = date || new Date().toISOString().split('T')[0];
    const { trajectory } = this.buildFallbackDay(d);
    const last = trajectory[trajectory.length - 1];
    const fallback: RobotLive = {
      dateReference: d,
      batteryPercent: 78,
      modeRobot: 'AUTONOME',
      chargingStatus: 'EN_CHARGE',
      position: { latitude: last.latitude, longitude: last.longitude, heure: '21:50:00', source: 'GPS', label: 'Site Principal ENOVA' },
      trajectory,
      chargeCycles: [
        { dockHeure: '10:57', undockHeure: '11:30', status: 'TERMINE', batteryBefore: 41, batteryAfter: 88, batteryGained: 47, durationMinutes: 33, stationLatitude: 36.8002, stationLongitude: 10.1805 },
        { dockHeure: '17:00', undockHeure: '17:45', status: 'TERMINE', batteryBefore: 38, batteryAfter: 95, batteryGained: 57, durationMinutes: 45, stationLatitude: 36.8002, stationLongitude: 10.1805 },
      ],
    };
    return this.http.get<RobotLive>(`${this.API_URL}/robot-live`, { params: this.dateParams(date) }).pipe(
      timeout(this.REQ_TIMEOUT),
      catchError(() => of(fallback))
    );
  }

  /**
   * Journee de repli riche (utilisee seulement si le backend Render est injoignable).
   * Avant, le repli n'avait que 3 points GPS -> la carte affichait "Point 1/3" et la
   * ronde bouclait presque instantanement. Ici on simule une vraie journee de
   * patrouille : plusieurs rondes completes autour d'une boucle de 8 balises,
   * deux passages en inspection, deux recharges rapides, un retour base en fin
   * de journee, et des anomalies detectees a des moments/lieux qui collent au trajet.
   */
  private buildFallbackDay(date: string): {
    trajectory: RobotLive['trajectory'];
    anomalies: Anomalie[];
    activity: ActivityFeedEntry[];
  } {
    // Boucle de 8 balises autour du site (Tunis) - la meme boucle est reparcourue a chaque ronde.
    const loop: [number, number][] = [
      [36.8002, 10.1805], // A - base / station de charge
      [36.8009, 10.1807], // B
      [36.8014, 10.1815], // C
      [36.8011, 10.1823], // D
      [36.8003, 10.1826], // E
      [36.7996, 10.1820], // F
      [36.7993, 10.1811], // G
      [36.7997, 10.1803], // H
    ];

    const trajectory: RobotLive['trajectory'] = [];
    let anomalyIdCounter = 200;
    const anomalies: Anomalie[] = [];
    const activity: ActivityFeedEntry[] = [];
    let ronde = 0;

    /** Ajoute des minutes a un couple (heure, minute), avec report d'heure correct. */
    const addMin = (h: number, m: number, delta: number): [number, number] => {
      const total = h * 60 + m + delta;
      return [Math.floor(total / 60), total % 60];
    };
    const fmt = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

    const addPoint = (h: number, m: number, [lat, lng]: [number, number], source: string, label: string) => {
      const heure = fmt(h, m);
      trajectory.push({ latitude: lat, longitude: lng, heure, source, label });
      return heure;
    };

    const addAnomaly = (heure: string, [lat, lng]: [number, number], type: string, criticite: Criticite) => {
      anomalies.push({
        id: anomalyIdCounter++,
        type,
        date,
        heure,
        criticite,
        statut: 'RESOLUE',
        latitude: lat,
        longitude: lng,
        imageUrl: null,
        robotId: 'ROBOT-001',
      });
    };

    // Une ronde = un tour complet de la boucle de 8 balises, ~7 min entre chaque point.
    const runRonde = (startH: number, startM: number): [number, number] => {
      ronde++;
      let h = startH;
      let m = startM;
      const startHeure = addPoint(h, m, loop[0], 'MISSION', `Ronde ${ronde} · Périmètre`);
      activity.push({
        id: `ronde-${ronde}-start`,
        kind: 'MISSION',
        heure: startHeure,
        datetime: `${date}T${startHeure}`,
        title: `Départ Ronde ${ronde}`,
        subtitle: 'Patrouille autonome du périmètre',
        tone: 'good',
        batteryLevel: Math.max(35, 96 - ronde * 8),
      });
      for (let i = 1; i < loop.length; i++) {
        [h, m] = addMin(h, m, 7);
        addPoint(h, m, loop[i], 'MISSION', `Ronde ${ronde} · Périmètre`);
      }
      [h, m] = addMin(h, m, 7);
      addPoint(h, m, loop[0], 'MISSION', `Ronde ${ronde} · Périmètre`);
      return [h, m];
    };

    const runInspection = (h: number, m: number, point: [number, number], zone: string): [number, number] => {
      const heure = addPoint(h, m, point, 'INSPECTION', `Inspection ${zone}`);
      const [h2, m2] = addMin(h, m, 4);
      addPoint(h2, m2, point, 'INSPECTION', `Inspection ${zone}`);
      activity.push({
        id: `inspection-${heure}`,
        kind: 'INSPECTING',
        heure,
        datetime: `${date}T${heure}`,
        title: `Inspection ${zone}`,
        subtitle: 'Vérification caméras thermiques',
        tone: 'good',
        batteryLevel: 84,
      });
      return [h2, m2];
    };

    const runDock = (h: number, m: number): [number, number] => {
      const heure = addPoint(h, m, loop[0], 'DOCKING', 'Vers la station · charge');
      activity.push({
        id: `dock-${heure}`,
        kind: 'DOCKING',
        heure,
        datetime: `${date}T${heure}`,
        title: 'Auto-Docking Station #1',
        subtitle: 'Recharge rapide effectuée',
        tone: 'good',
        batteryLevel: 91,
      });
      return addMin(h, m, 45);
    };

    // --- Journee ---
    let [eh, em] = runRonde(8, 0);
    addAnomaly(fmt(...addMin(8, 21, 0)), loop[3], 'Mouvement suspect Zone D', 'MOYENNE');

    let [ih, im] = addMin(eh, em, 10);
    [eh, em] = runInspection(ih, im, loop[2], 'Zone Dépôt');
    addAnomaly(fmt(eh, em), loop[2], 'Anomalie thermique détectée', 'FAIBLE');

    [eh, em] = runRonde(9, 30);
    [ih, im] = addMin(eh, em, 10);
    [eh, em] = runDock(ih, im);

    [eh, em] = runRonde(11, 45);
    addAnomaly(fmt(...addMin(11, 59, 0)), loop[3], 'Obstacle détecté sur trajectoire', 'MOYENNE');

    runInspection(13, 5, loop[5], 'Zone Sud');
    addAnomaly('13:12:00', loop[5], 'Intrusion détectée Zone F', 'HAUTE');

    [eh, em] = runRonde(13, 30);
    [eh, em] = runRonde(15, 30);
    addAnomaly(fmt(...addMin(eh, em, -20)), loop[1], 'Anomalie sonore détectée', 'FAIBLE');

    [ih, im] = addMin(eh, em, 25);
    [eh, em] = runDock(ih, im);
    [eh, em] = runRonde(18, 0);

    // Retour a la base en fin de journee.
    const retourHeure = addPoint(20, 30, loop[0], 'RETOUR_BASE', 'Retour a la base');
    activity.push({
      id: 'retour-base',
      kind: 'BACK_HOME',
      heure: retourHeure,
      datetime: `${date}T${retourHeure}`,
      title: 'Retour à la base',
      subtitle: 'Fin de patrouille · veille active',
      tone: 'good',
      batteryLevel: 78,
    });

    return { trajectory, anomalies, activity };
  }

  updateAnomalyStatus(id: number, statut: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/anomalies/${id}/statut?statut=${statut}`, {});
  }

  private dateParams(date?: string): HttpParams | undefined {
    return date ? new HttpParams().set('date', date) : undefined;
  }
}

