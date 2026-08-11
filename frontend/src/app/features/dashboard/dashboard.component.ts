import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, PLATFORM_ID, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LiveMapComponent, AnomalyMapPoint } from '../../shared/components/live-map/live-map.component';
import { BatteryRingComponent } from '../../shared/components/battery-ring/battery-ring.component';
import { ThemeService } from '../../core/services/theme.service';
import { LiveSimService } from '../../core/services/live-sim.service';
import { Anomalie, ChargeCycle, DashboardKpi, InspectionPoint, MissionEvent, RepartitionTemps, RobotLive, ActivityFeedEntry } from '../../shared/models/dashboard.models';
import { getAnomalyIcon } from '../../shared/utils/anomaly-icons';
import type { Chart } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiCardComponent, StatusBadgeComponent, LiveMapComponent, BatteryRingComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('distanceCanvas') distanceCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('repartitionCanvas') repartitionCanvas?: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly themeService = inject(ThemeService);
  protected readonly liveSim = inject(LiveSimService);

  kpi: DashboardKpi | null = null;
  repartition: RepartitionTemps | null = null;
  missions: MissionEvent[] = [];
  inspectionPoints: InspectionPoint[] = [];
  anomalies: Anomalie[] = [];
  activityFeed: ActivityFeedEntry[] = [];
  anomalyToast: Anomalie | null = null;
  private seenAnomalyIds = new Set<number>();
  private toastTimeout: any = null;
  robotLive: RobotLive | null = null;
  selectedDate = '';
  isRefreshing = false;
  private refreshingSince = 0;

  /** Aucune date posterieure a aujourd'hui n'est selectionnable : il n'existe pas de donnees pour le futur. */
  readonly maxDate = DashboardComponent.todayIso();

  private distanceChart?: Chart;
  private repartitionChart?: Chart;
  private refreshInterval: any = null;
  private clockInterval: any = null;
  liveClock = '';
  private distanceLabels: string[] = [];
  private distanceValues: number[] = [];

  constructor(private readonly mockData: MockDataService) {
    effect(() => {
      // Se relance a chaque changement de theme (clair/sombre) pour redessiner
      // les graphiques Chart.js avec les bonnes couleurs : ceux-ci ne sont pas
      // pilotes par les variables CSS (canvas), contrairement au reste du DOM.
      this.themeService.mode();
      if (this.distanceLabels.length || this.distanceValues.length) {
        this.renderDistanceChart(this.distanceLabels, this.distanceValues);
      }
      if (this.repartition) {
        this.renderRepartitionChart(this.repartition);
      }
    });

    // Fait "vivre" la courbe de kilometrage : des que le robot animé avance sur la
    // carte, on remplace le dernier point (aujourd'hui) par la distance reelle deja
    // parcourue jusque-la, au lieu d'attendre le total fige de fin de journee.
    effect(() => {
      const sim = this.liveSim.state();
      this.cdr.markForCheck();
      if (!sim.ready || !this.distanceChart || this.distanceValues.length === 0) return;
      const lastIndex = this.distanceValues.length - 1;
      const data = this.distanceChart.data.datasets?.[0]?.data as number[] | undefined;
      if (!data) return;
      data[lastIndex] = Math.round(sim.distanceKm * 100) / 100;
      this.distanceChart.update('none');
    });
  }

  ngOnInit(): void {
    this.selectedDate = DashboardComponent.todayIso();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadAll();
    this.refreshInterval = setInterval(() => {
      if ((this.selectedDate || this.maxDate) === this.maxDate) {
        this.loadAll();
      }
    }, 10000);
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    this.distanceChart?.destroy?.();
    this.repartitionChart?.destroy?.();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  private updateClock(): void {
    this.liveClock = new Date().toLocaleTimeString('fr-FR');
  }

  /**
   * Compare la liste d'anomalies fraichement recue a celles deja vues, et
   * declenche un toast "Nouvelle anomalie detectee" pour toute nouvelle
   * entree - rend visible, en direct, le moment exact ou le robot simule
   * detecte quelque chose (au lieu de ne le voir qu'en scrollant le tableau).
   * Au tout premier chargement, on memorise juste les ids existants sans
   * notifier (ce ne sont pas de "nouvelles" detections a cet instant-la).
   */
  private detectNewAnomalies(latest: Anomalie[]): void {
    const isFirstLoad = this.seenAnomalyIds.size === 0 && this.anomalies.length === 0;
    const freshOnes = latest.filter(a => !this.seenAnomalyIds.has(a.id));
    latest.forEach(a => this.seenAnomalyIds.add(a.id));

    if (isFirstLoad || freshOnes.length === 0) return;

    this.anomalyToast = freshOnes[0];
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.anomalyToast = null;
      this.cdr.markForCheck();
    }, 6000);
  }

  dismissAnomalyToast(): void {
    this.anomalyToast = null;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  private static todayIso(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private clampToMax(dateIso: string): string {
    return dateIso > this.maxDate ? this.maxDate : dateIso;
  }

  prevDay(): void {
    const base = this.selectedDate || this.maxDate;
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    this.selectedDate = this.clampToMax(d.toISOString().split('T')[0]);
    this.liveSim.reset();
    this.loadAll();
  }

  nextDay(): void {
    const base = this.selectedDate || this.maxDate;
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    this.selectedDate = this.clampToMax(d.toISOString().split('T')[0]);
    this.liveSim.reset();
    this.loadAll();
  }

  changeDate(): void {
    if (this.selectedDate) {
      this.selectedDate = this.clampToMax(this.selectedDate);
    }
    this.liveSim.reset();
    this.loadAll();
  }

  goToLatest(): void { this.selectedDate = this.maxDate; this.liveSim.reset(); this.loadAll(); }

  private loadAll(): void {
    const date = this.selectedDate || this.maxDate;
    this.isRefreshing = true;
    this.refreshingSince = Date.now();

    this.mockData.getKpi(date).subscribe(data => {
      if (!data.hasDataForDate && data.derniereDateAvecDonnees && this.selectedDate !== data.derniereDateAvecDonnees) {
        this.selectedDate = data.derniereDateAvecDonnees;
        this.loadAll();
        return;
      }
      this.kpi = data;
      if (!this.selectedDate) {
        this.selectedDate = this.clampToMax(data.dateReference);
      }
      this.cdr.markForCheck();
      this.endRefresh();
      this.trySyncLiveSim();
    });
    this.mockData.getRepartitionTemps(date).subscribe(data => { this.repartition = data; this.renderRepartitionChart(data); this.cdr.markForCheck(); });
    this.mockData.getMissionsDuJour(date).subscribe(m => { this.missions = m; this.cdr.markForCheck(); this.trySyncLiveSim(); });
    this.mockData.getInspectionPoints(date).subscribe(p => { this.inspectionPoints = p; this.cdr.markForCheck(); });
    this.mockData.getAnomaliesRecentes(date).subscribe(a => {
      this.detectNewAnomalies(a);
      this.anomalies = a;
      this.cdr.markForCheck();
      this.trySyncLiveSim();
    });
    this.mockData.getDistanceParJour().subscribe(pts => {
      this.distanceLabels = pts.map(p => p.date.slice(5));
      this.distanceValues = pts.map(p => p.cumulativeKm ?? p.distanceKm);
      this.renderDistanceChart(this.distanceLabels, this.distanceValues);
    });
    this.mockData.getRobotLive(date).subscribe(live => { this.robotLive = live; this.cdr.markForCheck(); this.trySyncLiveSim(); });
    this.mockData.getActivityFeed(date).subscribe(feed => { this.activityFeed = feed; this.cdr.markForCheck(); });
  }

  /**
   * Alimente le service de simulation en direct des que les 3 morceaux de donnees dont
   * il a besoin (trajectoire+cycles de charge, missions, anomalies) sont arrives pour la
   * date affichee — l'ordre d'arrivee des requetes HTTP n'est pas garanti, donc on retente
   * a chaque reponse plutot que de dependre d'un ordre precis. Le service lui-meme evite
   * de redemarrer la simulation a zero si la trajectoire n'a pas change (rafraichissement
   * automatique des 30s sur la meme date).
   */
  private trySyncLiveSim(): void {
    if (!this.robotLive) return;
    this.liveSim.initDay({
      trajectory: this.robotLive.trajectory ?? [],
      chargeCycles: this.robotLive.chargeCycles ?? [],
      missions: this.missions,
      anomalies: this.anomalies,
      finalBatteryPercent: this.robotLive.batteryPercent ?? 0,
    });
  }

  /** Garde la barre de rafraichissement visible au moins ~450ms pour qu'elle reste percue meme sur reseau rapide. */
  private endRefresh(): void {
    const elapsed = Date.now() - this.refreshingSince;
    const remaining = Math.min(800, Math.max(0, 450 - elapsed));
    setTimeout(() => { this.isRefreshing = false; this.cdr.markForCheck(); }, remaining);
  }

  referenceDateLabel(): string {
    const base = this.selectedDate || this.maxDate;
    const d = new Date(base + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  chargingStatusLabel(): string {
    if (this.liveSim.state().ready) {
      switch (this.liveSim.state().phase) {
        case 'dock': return 'En charge';
        case 'home': return 'Retour a la base';
        case 'teleop': return 'Téléopération active';
        default: return 'En mission';
      }
    }
    const status = this.robotLive?.chargingStatus ?? this.kpi?.chargingStatus;
    switch (status) {
      case 'EN_CHARGE': return 'En charge';
      case 'EN_DEPLACEMENT': return 'En mission';
      case 'EN_TELEPORTATION': return 'Téléopération active';
      default: return 'À la station';
    }
  }

  chargingTone(): 'good' | 'warning' | 'neutral' | 'critical' {
    if (this.liveSim.state().ready) {
      switch (this.liveSim.state().phase) {
        case 'dock': return 'good';
        case 'home': return 'warning';
        case 'teleop': return 'critical';
        default: return 'neutral';
      }
    }
    const s = this.robotLive?.chargingStatus ?? this.kpi?.chargingStatus;
    if (s === 'EN_CHARGE') return 'good';
    if (s === 'EN_DEPLACEMENT') return 'warning';
    if (s === 'EN_TELEPORTATION') return 'critical';
    return 'neutral';
  }

  /** Bornes reelles observees sur le robot : il ne descend jamais sous ~20% (retour au dock avant)
   *  et ne depasse jamais ~92% (le chargeur s'arrete la). On affiche donc cette plage comme
   *  "vide -> pleine" plutot que de montrer des pourcentages bruts qui ne semblent jamais complets. */
  private static readonly BATTERY_FLOOR = 21;
  private static readonly BATTERY_CEILING = 92;

  /** Batterie "live" (suit le mouvement anime du robot sur la carte) des qu'une simulation est prete pour cette date, sinon repli sur le dernier releve statique connu. */
  private rawBatteryPercent(): number {
    const sim = this.liveSim.state();
    if (sim.ready) return sim.batteryPercent;
    return this.robotLive?.batteryPercent ?? this.kpi?.batteryPercent ?? 0;
  }

  batteryValue(): string {
    const raw = this.rawBatteryPercent();
    if (raw >= DashboardComponent.BATTERY_CEILING) return '100';
    if (raw <= DashboardComponent.BATTERY_FLOOR) return '0';
    return String(Math.round(this.batteryPercentNumber()));
  }

  /** Pourcentage affiche (anneau, barre), remis a l'echelle entre le plancher et le plafond reels du robot. */
  batteryPercentNumber(): number {
    const raw = this.rawBatteryPercent();
    const { BATTERY_FLOOR: floor, BATTERY_CEILING: ceiling } = DashboardComponent;
    const clamped = Math.min(ceiling, Math.max(floor, raw));
    return Math.round(((clamped - floor) / (ceiling - floor)) * 100);
  }

  /** Libelle clair a afficher a la place du pourcentage brut quand le robot est proche des bornes reelles. */
  batteryStateLabel(): string | null {
    const raw = this.rawBatteryPercent();
    if (raw >= DashboardComponent.BATTERY_CEILING) return 'Charge complete';
    if (raw <= DashboardComponent.BATTERY_FLOOR) return 'Batterie faible';
    return null;
  }

  rondesValue(): string {
    if (this.liveSim.state().ready) return String(this.liveSim.state().roundsCount);
    return String(this.kpi?.rondesRealisees ?? 0);
  }

  /** Distance "live" (suit le mouvement anime du robot) des qu'une simulation est prete, sinon repli sur le total statique du jour.
   * 3 decimales pendant la simulation (resolution metrique) pour que la valeur bouge visiblement a chaque instant,
   * au lieu d'attendre plusieurs minutes qu'elle franchisse un seuil de 10 m avec seulement 2 decimales. */
  distanceKmDisplay(): string {
    const sim = this.liveSim.state();
    if (sim.ready) return sim.distanceKm.toFixed(3);
    return (this.kpi?.distanceJourKm ?? 0).toFixed(2);
  }

  /** Une ligne (mission/anomalie) est jugee "pas encore atteinte" si son horodatage reel est posterieur a l'instant courant de la simulation. */
  isPending(heure: string | null | undefined): boolean {
    const sim = this.liveSim.state();
    if (!sim.ready || !heure) return false;
    const parts = heure.split(':').map(Number);
    if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return false;
    const seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    return seconds > sim.nowSeconds;
  }

  positionLabel(): string {
    const pos = this.robotLive?.position;
    if (!pos?.latitude || !pos?.longitude) return 'Position inconnue';
    return pos.latitude.toFixed(6) + ', ' + pos.longitude.toFixed(6);
  }

  anomalyImageUrl(anomalie: Anomalie): string | null {
    return this.mockData.resolveImageUrl(anomalie.imageUrl);
  }

  anomalyIcon(type: string): string {
    return getAnomalyIcon(type);
  }

  /** Icone par type d'operation, pour l'avatar de chaque ligne du fil d'activite. */
  activityIcon(kind: string): string {
    const icons: Record<string, string> = {
      MISSION: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4l5 2 6-2 5 2v13l-5-2-6 2z"/><path d="M9 6v13M15 4v13"/></svg>',
      INSPECTING: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>',
      BACK_HOME: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5a1 1 0 0 0 1 1h3.5v-6h3v6H17a1 1 0 0 0 1-1V10"/></svg>',
      DOCKING: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 5 13h5.5L11 22l8-11h-5.5L13 2z"/></svg>',
      TELEOPERATION: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8.5" width="19" height="9" rx="4"/><circle cx="8" cy="13" r="1"/><circle cx="16" cy="11" r="0.6" fill="currentColor" stroke="none"/><circle cx="18.2" cy="13" r="0.6" fill="currentColor" stroke="none"/></svg>',
      DETECTION: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 21 20H3z"/><path d="M12 9.5v4.2"/><circle cx="12" cy="16.8" r="0.6" fill="currentColor" stroke="none"/></svg>',
    };
    return icons[kind] ?? icons['MISSION'];
  }

  // trackBy : sans ca, chaque rafraichissement (toutes les 1s) recree
  // entierement chaque ligne de liste (nouvelle reference de tableau a
  // chaque poll), ce qui redeclenche l'animation d'entree "enter-fade-up"
  // sur CHAQUE ligne en continu - un scintillement constant plutot qu'une
  // entree unique suivie de mises a jour fluides.
  trackByIndex(index: number): number { return index; }
  trackByMission(_index: number, m: MissionEvent): number { return m.id; }
  trackByAnomaly(_index: number, a: Anomalie): number { return a.id; }
  trackByActivity(_index: number, a: ActivityFeedEntry): string { return a.id; }

  /** Anomalies du jour projetees pour la carte, avec URL d'image absolue (le backend renvoie un chemin relatif). */
  anomaliesForMap(): AnomalyMapPoint[] {
    return this.anomalies.map(a => ({
      type: a.type,
      heure: a.heure,
      criticite: a.criticite,
      latitude: a.latitude,
      longitude: a.longitude,
      imageUrl: this.mockData.resolveImageUrl(a.imageUrl),
    }));
  }

  pctDynamique(): number {
    if (!this.repartition || this.repartition.totalMinutes === 0) return 0;
    return Math.round((this.repartition.dynamiqueMinutes / this.repartition.totalMinutes) * 100);
  }

  pctStatique(): number { return 100 - this.pctDynamique(); }

  eventLabel(m: MissionEvent): string {
    const t = m.type?.toLowerCase() ?? '';
    if (t.startsWith('start')) return 'Debut';
    if (t.startsWith('end')) return 'Fin';
    if (t.startsWith('pause')) return 'Pause';
    return m.type;
  }

  isStartEvent(m: MissionEvent): boolean { return (m.type ?? '').toLowerCase().startsWith('start'); }
  isEndEvent(m: MissionEvent): boolean { return (m.type ?? '').toLowerCase().startsWith('end'); }
  categoryClass(m: MissionEvent): string { return 'cat-' + (m.category ?? 'MISSION').toLowerCase(); }
  cycleStatusLabel(c: ChargeCycle): string { return c.status === 'EN_COURS' ? 'En charge' : 'Termine'; }

  /** Meme logique d'affichage que la batterie principale, appliquee a l'historique des cycles de charge. */
  batteryLabel(value: number | null | undefined): string {
    if (value == null) return '?';
    if (value >= DashboardComponent.BATTERY_CEILING) return 'Pleine';
    if (value <= DashboardComponent.BATTERY_FLOOR) return 'Vide';
    return value + '%';
  }

  /** Lit une variable CSS calculee sur <html>, pour garder les couleurs des graphiques Chart.js synchronisees avec le theme courant. */
  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private async renderDistanceChart(labels: string[], values: number[]) {
    if (!this.distanceCanvas) return;
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    this.distanceChart?.destroy?.();

    const accentActive = this.cssVar('--accent-active') || '#3DDC97';
    const borderSubtle = this.cssVar('--border-subtle') || '#1A2030';
    const textMuted = this.cssVar('--text-muted') || '#5C6577';

    this.distanceChart = new Chart(this.distanceCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Distance cumulee (km)',
          data: values,
          borderColor: accentActive,
          backgroundColor: accentActive + '14',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: accentActive,
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: borderSubtle }, ticks: { color: textMuted } },
          y: { grid: { color: borderSubtle }, ticks: { color: textMuted } },
        },
      },
    });
  }

  private async renderRepartitionChart(data: RepartitionTemps) {
    if (!this.repartitionCanvas) return;
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    this.repartitionChart?.destroy?.();

    const accentActive = this.cssVar('--accent-active') || '#3DDC97';
    const panelRaised = this.cssVar('--panel-raised') || '#232938';

    this.repartitionChart = new Chart(this.repartitionCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Dynamique', 'Statique'],
        datasets: [{
          data: [data.dynamiqueMinutes, data.statiqueMinutes],
          backgroundColor: [accentActive, panelRaised],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        animation: { duration: 800, easing: 'easeOutQuart', animateRotate: true, animateScale: true },
        plugins: { legend: { display: false } },
      },
    });
  }
}
