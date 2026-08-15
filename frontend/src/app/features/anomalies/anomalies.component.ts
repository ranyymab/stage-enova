import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FEATURE_PAGE_STYLES } from '../../shared/styles/feature-page.styles';
import { getSafeAnomalyIcon } from '../../shared/utils/anomaly-icons';

interface Anomalie {
  id: number;
  objectDetected: string;
  eventDate: string;
  rawHour: string;
  criticite: string;
  statut: string;
  robotId: string;
  imageFileName: string | null;
  imageFilePath: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Image generique par type d'objet detecte, utilisee des qu'une anomalie
 * n'a pas sa propre photo (ce qui est le cas le plus frequent : voir
 * imageUrl()). Ces fichiers doivent exister dans backend/data/images/ - ils
 * sont alors servis automatiquement par le WebConfig existant sous
 * /images/detections/** (meme mecanisme que les vraies photos de
 * detection). "obstacle" partage volontairement l'image "unknown" : le
 * robot ne classifie pas ce type plus precisement qu'un objet non
 * identifie, il n'y a donc pas d'illustration plus specifique a lui donner.
 */
const TYPE_IMAGE_FILE: Record<string, string> = {
  person: 'person.png',
  vehicle: 'car.png',
  animal: 'animal.png',
  debris: 'debris.jpg',
  obstacle: 'unknown.png',
  default: 'unknown.png',
};

@Component({
  selector: 'app-anomalies',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Anomalies</h1>
          <span class="page-sub">{{ anomalies.length }} detection(s)</span>
        </div>
        <div class="filters">
          <select (change)="filterStatut($event)">
            <option value="">All statuses</option>
            <option value="NOUVELLE">New</option>
            <option value="EN_COURS">In progress</option>
            <option value="RESOLUE">Resolved</option>
          </select>
          <select (change)="filterCriticite($event)">
            <option value="">All severities</option>
            <option value="FAIBLE">Low</option>
            <option value="MOYENNE">Medium</option>
            <option value="HAUTE">High</option>
            <option value="CRITIQUE">Critical</option>
          </select>
        </div>
      </header>

      <div class="loading" *ngIf="loading">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <div class="anomalies-grid" *ngIf="!loading && anomalies.length > 0">
        <div class="anomalie-card" *ngFor="let a of anomalies; let i = index" [style.animation-delay.ms]="i * 40" [attr.data-anomaly-id]="a.id">

          <div class="card-image" [attr.data-obj]="a.objectDetected?.toLowerCase()">
            <img *ngIf="imageUrl(a) as src" [src]="src" [alt]="a.objectDetected" class="card-image-photo" (error)="onImageError($event, a.id, 'photo')">
            <img *ngIf="!imageUrl(a) && typeImageUrl(a) as src2" [src]="src2" [alt]="a.objectDetected" class="card-image-photo" (error)="onImageError($event, a.id, 'type')">
            <span class="card-image-icon" *ngIf="!imageUrl(a) && !typeImageUrl(a)" [innerHTML]="objectIcon(a.objectDetected)"></span>
          </div>

          <div class="card-top">
            <span class="type-badge">{{ a.objectDetected?.toUpperCase() ?? 'UNKNOWN' }}</span>
            <span class="criticite-badge" [attr.data-level]="a.criticite">{{ criticiteLabel(a.criticite) }}</span>
          </div>

          <div class="card-meta">
            <span class="mono">{{ a.eventDate }} - {{ a.rawHour }}</span>
            <span *ngIf="a.latitude && a.longitude" class="mono coords">
              {{ a.latitude.toFixed(4) }}, {{ a.longitude.toFixed(4) }}
            </span>
          </div>

          <div class="card-footer">
            <span class="statut-badge" [attr.data-statut]="a.statut">{{ statutLabel(a.statut) }}</span>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="!loading && anomalies.length === 0">No anomalies found.</div>
    </div>
  `,
  styles: [FEATURE_PAGE_STYLES, `
    .anomalies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .anomalie-card {
      background: var(--panel-base);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-card);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      animation: cardRise 0.4s ease both;
    }

    .anomalie-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-3px);
    }

    .card-image {
      height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      position: relative;
      overflow: hidden;
    }

    .card-image[data-obj='person'] { background: linear-gradient(135deg, rgba(229, 72, 77, 0.15), rgba(229, 72, 77, 0.05)); }
    .card-image[data-obj='vehicle'] { background: linear-gradient(135deg, rgba(91, 141, 239, 0.15), rgba(91, 141, 239, 0.05)); }
    .card-image[data-obj='animal'] { background: linear-gradient(135deg, rgba(61, 220, 151, 0.15), rgba(61, 220, 151, 0.05)); }
    .card-image[data-obj='obstacle'] { background: linear-gradient(135deg, rgba(242, 169, 59, 0.15), rgba(242, 169, 59, 0.05)); }
    .card-image[data-obj='debris'] { background: linear-gradient(135deg, rgba(155, 163, 180, 0.15), rgba(155, 163, 180, 0.05)); }

    .card-image-icon {
      display: inline-flex;
      width: 34px;
      height: 34px;
      color: var(--text-secondary);
      opacity: 0.75;
      transition: transform 0.2s ease;
    }

    .card-image-photo {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .anomalie-card:hover .card-image-icon {
      transform: scale(1.08);
    }

    .card-image-label {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-muted);
      padding: 2px 8px;
      background: var(--panel-raised);
      border-radius: 4px;
      max-width: 90%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-image:has(.card-image-photo) .card-image-label {
      position: absolute;
      bottom: 6px;
      background: rgba(0,0,0,.55);
      color: #fff;
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px 4px;
    }

    .type-badge {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-primary);
      font-family: var(--font-mono);
    }

    .criticite-badge[data-level='FAIBLE'] { background: rgba(91, 141, 239, 0.15); color: #5B8DEF; }
    .criticite-badge[data-level='MOYENNE'] { background: rgba(242, 169, 59, 0.15); color: #F2A93B; }
    .criticite-badge[data-level='HAUTE'] { background: rgba(229, 72, 77, 0.15); color: #E5484D; }
    .criticite-badge[data-level='CRITIQUE'] { background: rgba(229, 72, 77, 0.3); color: #ff5c5c; }

    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 4px 14px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .coords { font-size: 11px; opacity: 0.8; }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px 14px;
      margin-top: auto;
      gap: 8px;
    }

    .statut-badge[data-statut='NOUVELLE'] { background: rgba(229, 72, 77, 0.15); color: #E5484D; }
    .statut-badge[data-statut='EN_COURS'] { background: rgba(242, 169, 59, 0.15); color: #F2A93B; }
    .statut-badge[data-statut='RESOLUE'] { background: rgba(61, 220, 151, 0.15); color: #3DDC97; }

  `],
})
export class AnomaliesComponent implements OnInit {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private readonly API_ORIGIN = 'https://stage-enova-3.onrender.com';
  anomalies: Anomalie[] = [];
  loading = true;
  private statutFilter = '';
  private criticiteFilter = '';
  /** Anomalies dont l'image reelle a echoue a charger (404) -> on retombe sur l'image generique du type plutot que de laisser une image cassee. */
  private brokenImages = new Set<number>();
  /** Anomalies dont MEME l'image generique du type a echoue (fichier absent de backend/data/images/) -> dernier repli, l'icone SVG. */
  private brokenTypeImages = new Set<number>();

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    let url = 'https://stage-enova-3.onrender.com/api/anomalies';
    const p: string[] = [];
    if (this.statutFilter) p.push('statut=' + this.statutFilter);
    if (this.criticiteFilter) p.push('criticite=' + this.criticiteFilter);
    if (p.length) url += '?' + p.join('&');
    this.http.get<Anomalie[]>(url).subscribe({
      next: d => { this.anomalies = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  filterStatut(e: Event) { this.statutFilter = (e.target as HTMLSelectElement).value; this.load(); }
  filterCriticite(e: Event) { this.criticiteFilter = (e.target as HTMLSelectElement).value; this.load(); }

  statutLabel(s: string) {
    return s === 'NOUVELLE' ? 'New' : s === 'EN_COURS' ? 'In progress' : 'Resolved';
  }

  criticiteLabel(c: string) {
    switch (c) {
      case 'FAIBLE': return 'Low';
      case 'MOYENNE': return 'Medium';
      case 'HAUTE': return 'High';
      case 'CRITIQUE': return 'Critical';
      default: return c;
    }
  }

  /** Construit l'URL absolue de la vraie photo de detection (le backend ne renvoie que le nom/chemin relatif). Null si pas d'image fournie, ou si son chargement a deja echoue - dans ce cas typeImageUrl() prend le relais. */
  imageUrl(a: Anomalie): string | null {
    if (this.brokenImages.has(a.id)) return null;
    const path = a.imageFilePath && a.imageFilePath.trim() !== ''
      ? a.imageFilePath
      : (a.imageFileName ? `/images/detections/${a.imageFileName}` : null);
    if (!path) return null;
    return path.startsWith('http') ? path : `${this.API_ORIGIN}${path}`;
  }

  /** Image generique par type (personne/vehicule/animal/debris/obstacle), servie depuis backend/data/images/ via le meme WebConfig que les vraies photos. C'est le cas le plus courant : la grande majorite des anomalies n'ont pas de photo individuelle. Null seulement si ce fichier-la a lui-meme echoue a charger. */
  typeImageUrl(a: Anomalie): string | null {
    if (this.brokenTypeImages.has(a.id)) return null;
    const key = (a.objectDetected ?? '').toLowerCase();
    const file = TYPE_IMAGE_FILE[key] ?? TYPE_IMAGE_FILE['default'];
    return `${this.API_ORIGIN}/images/detections/${file}`;
  }

  /** Repli en cascade : vraie photo cassee -> image du type ; image du type cassee (fichier pas encore depose sur le serveur) -> icone SVG. */
  onImageError(event: Event, id: number, level: 'photo' | 'type'): void {
    if (level === 'photo') {
      this.brokenImages.add(id);
    } else {
      this.brokenTypeImages.add(id);
    }
  }

  objectIcon(type: string | null | undefined): SafeHtml {
    return getSafeAnomalyIcon(this.sanitizer, type);
  }

}