import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FEATURE_PAGE_STYLES } from '../../shared/styles/feature-page.styles';
import { getAnomalyIcon } from '../../shared/utils/anomaly-icons';

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
            <option value="">Tous statuts</option>
            <option value="NOUVELLE">Nouvelle</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLUE">Resolue</option>
          </select>
          <select (change)="filterCriticite($event)">
            <option value="">Toutes criticites</option>
            <option value="FAIBLE">Faible</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="HAUTE">Haute</option>
            <option value="CRITIQUE">Critique</option>
          </select>
        </div>
      </header>

      <div class="loading" *ngIf="loading">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <div class="anomalies-grid" *ngIf="!loading && anomalies.length > 0">
        <div class="anomalie-card" *ngFor="let a of anomalies; let i = index" [style.animation-delay.ms]="i * 40" [attr.data-anomaly-id]="a.id">

          <div class="card-image" [attr.data-obj]="a.objectDetected?.toLowerCase()">
            <img *ngIf="imageUrl(a) as src" [src]="src" [alt]="a.objectDetected" class="card-image-photo" (error)="onImageError($event)">
            <span class="card-image-icon" *ngIf="!imageUrl(a)" [innerHTML]="objectIcon(a.objectDetected)"></span>
          </div>

          <div class="card-top">
            <span class="type-badge">{{ a.objectDetected?.toUpperCase() ?? 'INCONNU' }}</span>
            <span class="criticite-badge" [attr.data-level]="a.criticite">{{ a.criticite }}</span>
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

      <div class="empty" *ngIf="!loading && anomalies.length === 0">Aucune anomalie trouvee.</div>
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
  private readonly API_ORIGIN = 'https://stage-enova-3.onrender.com';
  anomalies: Anomalie[] = [];
  loading = true;
  private statutFilter = '';
  private criticiteFilter = '';
  /** Anomalies dont l'image a echoue a charger (404) -> on revient a l'icone emoji plutot que de laisser une image cassee. */
  private brokenImages = new Set<number>();

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
    return s === 'NOUVELLE' ? 'Nouvelle' : s === 'EN_COURS' ? 'En cours' : 'Resolue';
  }

  /** Construit l'URL absolue de l'image (le backend ne renvoie que le nom/chemin relatif). Null si pas d'image, ou si son chargement a deja echoue. */
  imageUrl(a: Anomalie): string | null {
    if (this.brokenImages.has(a.id)) return null;
    const path = a.imageFilePath && a.imageFilePath.trim() !== ''
      ? a.imageFilePath
      : (a.imageFileName ? `/images/detections/${a.imageFileName}` : null);
    if (!path) return null;
    return path.startsWith('http') ? path : `${this.API_ORIGIN}${path}`;
  }

  /** Repli sur l'icone (photo cassee ou jamais fournie) plutot qu'une icone d'image cassee du navigateur. */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const card = img.closest('.anomalie-card');
    const id = card?.getAttribute('data-anomaly-id');
    if (id) this.brokenImages.add(Number(id));
  }

  objectIcon(type: string | null | undefined): string {
    return getAnomalyIcon(type);
  }

}
