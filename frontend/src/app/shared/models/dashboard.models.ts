

export type MissionStatut = 'EN_MISSION' | 'EN_REPOS' | 'EN_TELEPORTATION' | 'RETOUR_BASE';
export type RobotMode = 'AUTONOME' | 'TELEPORTATION' | 'TELEPORTATION_URGENCE' | 'RETOUR_BASE';

export interface DashboardKpi {
  distanceJourKm: number;
  anomaliesOuvertes: number;
  sessionsTeleoperation: number;
  rondesRealisees: number;
  retoursBase: number;
  retourBaseEnCours: boolean;
  statutMission: MissionStatut;
  missionEnCours: string | null;
  dateReference: string;
  derniereMiseAJour: string;
  batteryPercent?: number;
  chargingStatus?: ChargingStatus;
  hasDataForDate: boolean;
  derniereDateAvecDonnees: string | null;
  teleportationEnCours: boolean;
  modeRobot?: RobotMode;
}

export type ChargingStatus = 'EN_CHARGE' | 'EN_DEPLACEMENT' | 'A_LA_STATION' | 'EN_TELEPORTATION';

export interface DistancePoint {
  date: string; // AAAA-MM-JJ
  distanceKm: number;
  cumulativeKm?: number;
}

export interface RepartitionTemps {
  dynamiqueMinutes: number;
  statiqueMinutes: number;
  totalMinutes: number;
  dateReference?: string;
}

export type MissionCategory = 'MISSION' | 'DOCKING' | 'INSPECTING' | 'BACK_HOME';

export interface ActivityFeedEntry {
  id: string;
  kind: 'MISSION' | 'INSPECTING' | 'BACK_HOME' | 'DOCKING' | 'TELEOPERATION' | 'DETECTION';
  heure: string;
  datetime: string | null;
  title: string;
  subtitle: string | null;
  tone: 'good' | 'warning' | 'critical' | 'neutral';
  batteryLevel?: number | null;
  objectDetected?: string | null;
}

export interface MissionEvent {
  id: number;
  category: MissionCategory;
  categoryLabel: string;
  missionName: string;
  type: string;
  date: string;
  heure: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number | null;
  startPoint?: string | null;
  stopPoint?: string | null;
  lastPoint?: string | null;
}

export interface InspectionPoint {
  id: number;
  lastPoint: number;
  delaySeconds: number;
  heure: string;
  missionName: string;
  date?: string;
}

export type Criticite = 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
export type StatutAnomalie = 'NOUVELLE' | 'EN_COURS' | 'RESOLUE';

export interface Anomalie {
  id: number;
  type: string;
  date: string;
  heure: string;
  criticite: Criticite;
  statut: StatutAnomalie;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  robotId: string;
}

export interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  heure: string;
  source: string;
  label: string;
  detail?: string | null;
}

export interface RobotPosition {
  latitude: number;
  longitude: number;
  heure: string;
  source: string;
  label: string;
  detail?: string | null;
  date?: string;
}

export interface ChargeCycle {
  dockHeure: string;
  undockHeure: string | null;
  batteryBefore: number | null;
  batteryAfter: number | null;
  batteryGained: number | null;
  durationMinutes: number | null;
  stationLatitude: number | null;
  stationLongitude: number | null;
  status: 'TERMINE' | 'EN_COURS';
}

export interface RobotLive {
  dateReference: string;
  batteryPercent: number;
  chargingStatus: ChargingStatus;
  position: RobotPosition;
  trajectory: TrajectoryPoint[];
  chargeCycles: ChargeCycle[];
  modeRobot?: RobotMode;
}
