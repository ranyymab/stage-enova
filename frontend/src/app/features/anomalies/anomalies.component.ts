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

  // Supported by the frontend in case the backend returns
  // one of these directly.
  imageUrl?: string | null;
  photoUrl?: string | null;

  latitude: number | null;
  longitude: number | null;
}

/*
 * Generic images used when an anomaly does not have
 * an individual detection photo.
 *
 * These files must exist on the backend under:
 *
 * backend/data/images/
 *
 * and be accessible through:
 *
 * /images/detections/<filename>
 */
const TYPE_IMAGE_FILE: Record<string, string> = {
  person: 'person.png',
  vehicle: 'car.png',
  car: 'car.png',
  animal: 'animal.png',
  debris: 'debris.jpg',
  obstacle: 'unknown.png',
  unknown: 'unknown.png',
  default: 'unknown.png',
};

@Component({
  selector: 'app-anomalies',
  standalone: true,
  imports: [CommonModule],

  template: `
    <div class="page">

      <!-- HEADER -->
      <header class="page-header">

        <div>
          <h1>Anomalies</h1>

          <span class="page-sub">
            {{ anomalies.length }} detection(s)
          </span>
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


      <!-- LOADING -->
      <div class="loading" *ngIf="loading">

        <div
          class="skeleton-row"
          *ngFor="let i of [1, 2, 3, 4]"
        ></div>

      </div>


      <!-- ANOMALIES -->
      <div
        class="anomalies-grid"
        *ngIf="!loading && anomalies.length > 0"
      >

        <div
          class="anomalie-card"
          *ngFor="let a of anomalies; let i = index"
          [style.animation-delay.ms]="i * 40"
          [attr.data-anomaly-id]="a.id"
        >

          <!-- IMAGE -->
          <div
            class="card-image"
            [attr.data-obj]="getObjectType(a.objectDetected)"
          >

            <!--
              1. REAL ANOMALY IMAGE
            -->
            <img
              *ngIf="imageUrl(a) as src"
              [src]="src"
              [alt]="a.objectDetected || 'Anomaly'"
              class="card-image-photo"
              loading="lazy"
              (error)="onImageError($event, a.id, 'photo')"
              (load)="onImageLoad(a.id, 'photo')"
            />


            <!--
              2. GENERIC TYPE IMAGE
            -->
            <img
              *ngIf="
                !imageUrl(a) &&
                typeImageUrl(a) as src2
              "
              [src]="src2"
              [alt]="a.objectDetected || 'Anomaly'"
              class="card-image-photo"
              loading="lazy"
              (error)="onImageError($event, a.id, 'type')"
              (load)="onImageLoad(a.id, 'type')"
            />


            <!--
              3. SVG FALLBACK
            -->
            <span
              class="card-image-icon"
              *ngIf="
                !imageUrl(a) &&
                !typeImageUrl(a)
              "
              [innerHTML]="objectIcon(a.objectDetected)"
            ></span>

          </div>


          <!-- TOP -->
          <div class="card-top">

            <span class="type-badge">
              {{ a.objectDetected || 'UNKNOWN' | uppercase }}
            </span>

            <span
              class="criticite-badge"
              [attr.data-level]="a.criticite"
            >
              {{ criticiteLabel(a.criticite) }}
            </span>

          </div>


          <!-- META -->
          <div class="card-meta">

            <span class="mono">
              {{ a.eventDate || '—' }}
              -
              {{ a.rawHour || '—' }}
            </span>

            <span
              *ngIf="
                a.latitude !== null &&
                a.longitude !== null
              "
              class="mono coords"
            >
              {{ a.latitude.toFixed(4) }},
              {{ a.longitude.toFixed(4) }}
            </span>

          </div>


          <!-- FOOTER -->
          <div class="card-footer">

            <span
              class="statut-badge"
              [attr.data-statut]="a.statut"
            >
              {{ statutLabel(a.statut) }}
            </span>

          </div>

        </div>

      </div>


      <!-- EMPTY -->
      <div
        class="empty"
        *ngIf="
          !loading &&
          !loadError &&
          anomalies.length === 0
        "
      >
        No anomalies found.
      </div>


      <!-- ERROR -->
      <div
        class="empty"
        *ngIf="!loading && loadError"
      >

        <strong>
          Unable to load anomalies.
        </strong>

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
  `,

  styles: [
    FEATURE_PAGE_STYLES,

    `
      .anomalies-grid {
        display: grid;
        grid-template-columns:
          repeat(
            auto-fill,
            minmax(300px, 1fr)
          );
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
        transition:
          box-shadow 0.2s ease,
          transform 0.2s ease;
        animation:
          cardRise 0.4s ease both;
      }

      .anomalie-card:hover {
        box-shadow: var(--shadow-card-hover);
        transform: translateY(-3px);
      }


      /* IMAGE AREA */

      .card-image {
        height: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        position: relative;
        overflow: hidden;
        background: var(--panel-raised);
      }


      /* Object-specific backgrounds */

      .card-image[data-obj='person'] {
        background:
          linear-gradient(
            135deg,
            rgba(229, 72, 77, 0.15),
            rgba(229, 72, 77, 0.05)
          );
      }

      .card-image[data-obj='vehicle'],
      .card-image[data-obj='car'] {
        background:
          linear-gradient(
            135deg,
            rgba(91, 141, 239, 0.15),
            rgba(91, 141, 239, 0.05)
          );
      }

      .card-image[data-obj='animal'] {
        background:
          linear-gradient(
            135deg,
            rgba(61, 220, 151, 0.15),
            rgba(61, 220, 151, 0.05)
          );
      }

      .card-image[data-obj='obstacle'] {
        background:
          linear-gradient(
            135deg,
            rgba(242, 169, 59, 0.15),
            rgba(242, 169, 59, 0.05)
          );
      }

      .card-image[data-obj='debris'] {
        background:
          linear-gradient(
            135deg,
            rgba(155, 163, 180, 0.15),
            rgba(155, 163, 180, 0.05)
          );
      }


      /* REAL IMAGE */

      .card-image-photo {
        position: absolute;
        inset: 0;

        width: 100%;
        height: 100%;

        object-fit: cover;

        display: block;

        z-index: 2;

        background: var(--panel-raised);

        transition:
          transform 0.25s ease,
          opacity 0.25s ease;
      }

      .anomalie-card:hover
      .card-image-photo {
        transform: scale(1.03);
      }


      /* SVG FALLBACK */

      .card-image-icon {
        display: inline-flex;

        width: 44px;
        height: 44px;

        color: var(--text-secondary);

        opacity: 0.75;

        position: relative;
        z-index: 1;

        transition:
          transform 0.2s ease;
      }

      .anomalie-card:hover
      .card-image-icon {
        transform: scale(1.08);
      }


      /* TOP */

      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        padding:
          12px
          14px
          4px;
      }

      .type-badge {
        font-size: 12.5px;
        font-weight: 700;

        color: var(--text-primary);

        font-family:
          var(--font-mono);
      }


      /* CRITICALITY */

      .criticite-badge[data-level='FAIBLE'] {
        background:
          rgba(91, 141, 239, 0.15);
        color: #5B8DEF;
      }

      .criticite-badge[data-level='MOYENNE'] {
        background:
          rgba(242, 169, 59, 0.15);
        color: #F2A93B;
      }

      .criticite-badge[data-level='HAUTE'] {
        background:
          rgba(229, 72, 77, 0.15);
        color: #E5484D;
      }

      .criticite-badge[data-level='CRITIQUE'] {
        background:
          rgba(229, 72, 77, 0.3);
        color: #ff5c5c;
      }


      /* META */

      .card-meta {
        display: flex;
        flex-direction: column;

        gap: 3px;

        padding:
          4px
          14px;

        font-size: 12px;

        color:
          var(--text-muted);
      }

      .coords {
        font-size: 11px;
        opacity: 0.8;
      }


      /* FOOTER */

      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;

        padding:
          10px
          14px
          14px;

        margin-top: auto;

        gap: 8px;
      }


      /* STATUS */

      .statut-badge[data-statut='NOUVELLE'] {
        background:
          rgba(229, 72, 77, 0.15);
        color: #E5484D;
      }

      .statut-badge[data-statut='EN_COURS'] {
        background:
          rgba(242, 169, 59, 0.15);
        color: #F2A93B;
      }

      .statut-badge[data-statut='RESOLUE'] {
        background:
          rgba(61, 220, 151, 0.15);
        color: #3DDC97;
      }


      /* RETRY */

      .retry-btn {
        margin-top: 4px;

        padding:
          7px
          16px;

        border-radius: 8px;

        border:
          1px solid
          var(--border-subtle);

        background:
          var(--panel-base);

        color:
          var(--text-primary);

        font-size: 12.5px;

        font-weight: 600;

        cursor: pointer;

        transition:
          background 0.15s ease,
          border-color 0.15s ease;
      }

      .retry-btn:hover {
        background:
          var(--panel-raised);

        border-color:
          var(--accent-primary);
      }
    `
  ],
})
export class AnomaliesComponent implements OnInit {

  private http = inject(HttpClient);

  private sanitizer = inject(DomSanitizer);

  /*
   * Backend origin.
   */
  private readonly API_ORIGIN =
    'https://stage-enova-3.onrender.com';


  anomalies: Anomalie[] = [];

  loading = true;

  loadError = false;


  private statutFilter = '';

  private criticiteFilter = '';


  /*
   * IDs whose REAL image failed.
   */
  private brokenImages =
    new Set<number>();


  /*
   * IDs whose GENERIC image failed.
   */
  private brokenTypeImages =
    new Set<number>();


  ngOnInit(): void {
    this.load();
  }


  /*
   * LOAD ANOMALIES
   */

  load(): void {

    this.loading = true;

    this.loadError = false;

    /*
     * Clear previous broken-image state
     * when reloading/filtering.
     */
    this.brokenImages.clear();

    this.brokenTypeImages.clear();


    let url =
      `${this.API_ORIGIN}/api/anomalies`;


    const params: string[] = [];


    if (this.statutFilter) {

      params.push(
        `statut=${encodeURIComponent(
          this.statutFilter
        )}`
      );
    }


    if (this.criticiteFilter) {

      params.push(
        `criticite=${encodeURIComponent(
          this.criticiteFilter
        )}`
      );
    }


    if (params.length > 0) {

      url += `?${params.join('&')}`;
    }


    console.log(
      '[ANOMALIES] Loading:',
      url
    );


    this.http
      .get<Anomalie[]>(url)
      .subscribe({

        next: (data) => {

          console.log(
            '[ANOMALIES] API response:',
            data
          );


          /*
           * Log every image-related field.
           *
           * This makes it very easy to see
           * what the backend actually returns.
           */
          data.forEach((a) => {

            console.log(
              `[ANOMALY ${a.id}]`,
              {
                objectDetected:
                  a.objectDetected,

                imageFileName:
                  a.imageFileName,

                imageFilePath:
                  a.imageFilePath,

                imageUrl:
                  a.imageUrl,

                photoUrl:
                  a.photoUrl,

                calculatedImageUrl:
                  this.buildImageUrl(a),
              }
            );

          });


          this.anomalies = data;

          this.loading = false;
        },


        error: (error) => {

          console.error(
            '[ANOMALIES] API error:',
            error
          );

          this.loading = false;

          this.loadError = true;
        }

      });
  }


  /*
   * FILTERS
   */

  filterStatut(event: Event): void {

    this.statutFilter =
      (event.target as HTMLSelectElement).value;

    this.load();
  }


  filterCriticite(event: Event): void {

    this.criticiteFilter =
      (event.target as HTMLSelectElement).value;

    this.load();
  }


  /*
   * STATUS LABEL
   */

  statutLabel(status: string): string {

    switch (status) {

      case 'NOUVELLE':
        return 'New';

      case 'EN_COURS':
        return 'In progress';

      case 'RESOLUE':
        return 'Resolved';

      default:
        return status || 'Unknown';
    }
  }


  /*
   * CRITICALITY LABEL
   */

  criticiteLabel(
    criticite: string
  ): string {

    switch (criticite) {

      case 'FAIBLE':
        return 'Low';

      case 'MOYENNE':
        return 'Medium';

      case 'HAUTE':
        return 'High';

      case 'CRITIQUE':
        return 'Critical';

      default:
        return criticite || 'Unknown';
    }
  }


  /*
   * NORMALIZE OBJECT TYPE
   */

  getObjectType(
    type: string | null | undefined
  ): string {

    return (type ?? 'unknown')
      .trim()
      .toLowerCase();
  }


  /*
   * BUILD THE REAL IMAGE URL
   *
   * Priority:
   *
   * 1. imageUrl
   * 2. photoUrl
   * 3. imageFilePath
   * 4. imageFileName
   */

  private buildImageUrl(
    a: Anomalie
  ): string | null {

    let path: string | null = null;


    /*
     * 1. Direct image URL
     */

    if (
      a.imageUrl &&
      a.imageUrl.trim() !== ''
    ) {

      path =
        a.imageUrl.trim();
    }


    /*
     * 2. Direct photo URL
     */

    else if (
      a.photoUrl &&
      a.photoUrl.trim() !== ''
    ) {

      path =
        a.photoUrl.trim();
    }


    /*
     * 3. Backend image path
     */

    else if (
      a.imageFilePath &&
      a.imageFilePath.trim() !== ''
    ) {

      path =
        a.imageFilePath.trim();
    }


    /*
     * 4. Image filename
     */

    else if (
      a.imageFileName &&
      a.imageFileName.trim() !== ''
    ) {

      path =
        `/images/detections/${a.imageFileName.trim()}`;
    }


    /*
     * Nothing available.
     */

    if (!path) {

      return null;
    }


    /*
     * Already absolute.
     */

    if (
      path.startsWith('http://') ||
      path.startsWith('https://')
    ) {

      return path;
    }


    /*
     * Normalize relative path.
     */

    if (!path.startsWith('/')) {

      path =
        `/${path}`;
    }


    return `${this.API_ORIGIN}${path}`;
  }


  /*
   * REAL IMAGE
   */

  imageUrl(
    a: Anomalie
  ): string | null {

    if (
      this.brokenImages.has(a.id)
    ) {

      return null;
    }


    return this.buildImageUrl(a);
  }


  /*
   * GENERIC IMAGE
   */

  typeImageUrl(
    a: Anomalie
  ): string | null {

    if (
      this.brokenTypeImages.has(a.id)
    ) {

      return null;
    }


    const key =
      this.getObjectType(
        a.objectDetected
      );


    const file =
      TYPE_IMAGE_FILE[key] ??
      TYPE_IMAGE_FILE['default'];


    const url =
      `${this.API_ORIGIN}/images/detections/${file}`;


    return url;
  }


  /*
   * IMAGE LOADED SUCCESSFULLY
   */

  onImageLoad(
    id: number,
    level: 'photo' | 'type'
  ): void {

    console.log(
      `[ANOMALIES] ${level} image loaded successfully for anomaly ${id}`
    );
  }


  /*
   * IMAGE FAILED
   */

  onImageError(
    event: Event,
    id: number,
    level: 'photo' | 'type'
  ): void {

    const img =
      event.target as HTMLImageElement;


    console.error(
      `[ANOMALIES] ${level} image FAILED for anomaly ${id}:`,
      img?.src
    );


    /*
     * REAL PHOTO failed.
     *
     * Hide it so Angular displays
     * the generic type image.
     */

    if (level === 'photo') {

      this.brokenImages.add(id);

      return;
    }


    /*
     * GENERIC TYPE image also failed.
     *
     * Hide it so Angular displays
     * the SVG icon.
     */

    this.brokenTypeImages.add(id);
  }


  /*
   * SVG FALLBACK
   */

  objectIcon(
    type: string | null | undefined
  ): SafeHtml {

    return getSafeAnomalyIcon(
      this.sanitizer,
      type
    );
  }
}