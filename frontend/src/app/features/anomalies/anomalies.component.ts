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

  imageUrl?: string | null;
  photoUrl?: string | null;

  latitude: number | null;
  longitude: number | null;
}


/*
 * Generic images available on the backend.
 *
 * IMPORTANT:
 *
 * These correspond to:
 *
 * backend/data/images/
 *
 * They are exposed publicly through:
 *
 * /images/detections/<filename>
 *
 * There is intentionally NO unknown.png here.
 *
 * If there is no matching generic image,
 * the component falls back to the SVG icon.
 */
const TYPE_IMAGE_FILE: Record<string, string> = {

  /* English */

  person: 'person.png',
  people: 'person.png',
  pedestrian: 'person.png',

  vehicle: 'car.png',
  car: 'car.png',
  automobile: 'car.png',

  animal: 'animal.png',

  debris: 'debris.jpg',
  rubbish: 'debris.jpg',
  waste: 'debris.jpg',


  /* French */

  personne: 'person.png',
  personnes: 'person.png',

  pieton: 'person.png',
  piéton: 'person.png',

  vehicule: 'car.png',
  véhicule: 'car.png',
  voiture: 'car.png',

  animaux: 'animal.png',

  débris: 'debris.jpg'
};


@Component({
  selector: 'app-anomalies',

  standalone: true,

  imports: [
    CommonModule
  ],

  template: `

    <div class="page">


      <!-- =========================================================
           HEADER
           ========================================================= -->

      <header class="page-header">

        <div>

          <h1>
            Anomalies
          </h1>

          <span class="page-sub">
            {{ anomalies.length }} detection(s)
          </span>

        </div>


        <div class="filters">

          <select
            [value]="statutFilter"
            (change)="filterStatut($event)"
          >

            <option value="">
              All statuses
            </option>

            <option value="NOUVELLE">
              New
            </option>

            <option value="EN_COURS">
              In progress
            </option>

            <option value="RESOLUE">
              Resolved
            </option>

          </select>


          <select
            [value]="criticiteFilter"
            (change)="filterCriticite($event)"
          >

            <option value="">
              All severities
            </option>

            <option value="FAIBLE">
              Low
            </option>

            <option value="MOYENNE">
              Medium
            </option>

            <option value="HAUTE">
              High
            </option>

            <option value="CRITIQUE">
              Critical
            </option>

          </select>

        </div>

      </header>


      <!-- =========================================================
           LOADING
           ========================================================= -->

      <div
        class="loading"
        *ngIf="loading"
      >

        <div
          class="skeleton-row"
          *ngFor="let i of [1, 2, 3, 4]"
        ></div>

      </div>


      <!-- =========================================================
           ANOMALIES
           ========================================================= -->

      <div
        class="anomalies-grid"
        *ngIf="
          !loading &&
          anomalies.length > 0
        "
      >

        <div
          class="anomalie-card"
          *ngFor="
            let a of anomalies;
            let i = index
          "
          [style.animation-delay.ms]="i * 40"
          [attr.data-anomaly-id]="a.id"
        >


          <!-- =====================================================
               IMAGE
               ===================================================== -->

          <div
            class="card-image"
            [attr.data-obj]="getObjectType(a.objectDetected)"
          >


            <!-- ===================================================
                 1. REAL ANOMALY PHOTO
                 =================================================== -->

            <img
              *ngIf="imageUrl(a) as src"
              [src]="src"
              [alt]="
                a.objectDetected ||
                'Anomaly'
              "
              class="card-image-photo"
              loading="lazy"

              (error)="
                onImageError(
                  $event,
                  a.id,
                  'photo'
                )
              "

              (load)="
                onImageLoad(
                  a.id,
                  'photo'
                )
              "
            />


            <!-- ===================================================
                 2. GENERIC TYPE IMAGE
                 =================================================== -->

            <img
              *ngIf="
                !imageUrl(a) &&
                typeImageUrl(a) as src2
              "
              [src]="src2"
              [alt]="
                a.objectDetected ||
                'Anomaly'
              "
              class="card-image-photo"
              loading="lazy"

              (error)="
                onImageError(
                  $event,
                  a.id,
                  'type'
                )
              "

              (load)="
                onImageLoad(
                  a.id,
                  'type'
                )
              "
            />


            <!-- ===================================================
                 3. SVG FALLBACK
                 =================================================== -->

            <span
              class="card-image-icon"

              *ngIf="
                !imageUrl(a) &&
                !typeImageUrl(a)
              "

              [innerHTML]="
                objectIcon(
                  a.objectDetected
                )
              "
            ></span>


            <!-- ===================================================
                 TECHNICAL LABEL
                 =================================================== -->

            <span
              class="image-type-label"
              *ngIf="
                !imageUrl(a) &&
                !typeImageUrl(a)
              "
            >
              NO IMAGE
            </span>

          </div>


          <!-- =====================================================
               TOP
               ===================================================== -->

          <div class="card-top">

            <span class="type-badge">

              {{
                a.objectDetected ||
                'UNKNOWN'
              | uppercase }}

            </span>


            <span
              class="criticite-badge"

              [attr.data-level]="
                a.criticite
              "
            >

              {{
                criticiteLabel(
                  a.criticite
                )
              }}

            </span>

          </div>


          <!-- =====================================================
               META
               ===================================================== -->

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


          <!-- =====================================================
               FOOTER
               ===================================================== -->

          <div class="card-footer">

            <span
              class="statut-badge"
              [attr.data-statut]="
                a.statut
              "
            >

              {{
                statutLabel(
                  a.statut
                )
              }}

            </span>

          </div>

        </div>

      </div>


      <!-- =========================================================
           EMPTY
           ========================================================= -->

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


      <!-- =========================================================
           ERROR
           ========================================================= -->

      <div
        class="empty"

        *ngIf="
          !loading &&
          loadError
        "
      >

        <strong>
          Unable to load anomalies.
        </strong>

        <span>
          The server did not respond
          (it may be asleep and take a few
          seconds to restart).
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

      /* ==========================================================
         GRID
         ========================================================== */

      .anomalies-grid {

        display: grid;

        grid-template-columns:
          repeat(
            auto-fill,
            minmax(
              300px,
              1fr
            )
          );

        gap: 16px;

      }


      /* ==========================================================
         CARD
         ========================================================== */

      .anomalie-card {

        background:
          var(--panel-base);

        border:
          1px solid
          var(--border-subtle);

        border-radius:
          16px;

        overflow:
          hidden;

        display:
          flex;

        flex-direction:
          column;

        box-shadow:
          var(--shadow-card);

        transition:
          box-shadow .2s ease,
          transform .2s ease,
          border-color .2s ease;

        animation:
          cardRise
          .4s
          ease
          both;

      }


      .anomalie-card:hover {

        box-shadow:
          var(--shadow-card-hover);

        border-color:
          color-mix(
            in srgb,
            var(--accent-primary) 25%,
            var(--border-subtle)
          );

        transform:
          translateY(-3px);

      }


      /* ==========================================================
         IMAGE
         ========================================================== */

      .card-image {

        height:
          180px;

        display:
          flex;

        flex-direction:
          column;

        align-items:
          center;

        justify-content:
          center;

        gap:
          7px;

        position:
          relative;

        overflow:
          hidden;

        background:
          var(--panel-raised);

      }


      /* ==========================================================
         TYPE BACKGROUNDS
         ========================================================== */

      .card-image[data-obj='person'],
      .card-image[data-obj='personne'],
      .card-image[data-obj='personnes'],
      .card-image[data-obj='pedestrian'],
      .card-image[data-obj='pieton'],
      .card-image[data-obj='piéton'] {

        background:
          linear-gradient(
            135deg,
            color-mix(
              in srgb,
              var(--accent-primary) 12%,
              var(--panel-raised)
            ),
            var(--panel-raised)
          );

      }


      .card-image[data-obj='vehicle'],
      .card-image[data-obj='car'],
      .card-image[data-obj='automobile'],
      .card-image[data-obj='vehicule'],
      .card-image[data-obj='véhicule'],
      .card-image[data-obj='voiture'] {

        background:
          linear-gradient(
            135deg,
            color-mix(
              in srgb,
              var(--accent-primary) 11%,
              var(--panel-raised)
            ),
            var(--panel-raised)
          );

      }


      .card-image[data-obj='animal'],
      .card-image[data-obj='animaux'] {

        background:
          linear-gradient(
            135deg,
            color-mix(
              in srgb,
              var(--accent-active) 10%,
              var(--panel-raised)
            ),
            var(--panel-raised)
          );

      }


      .card-image[data-obj='debris'] {

        background:
          linear-gradient(
            135deg,
            color-mix(
              in srgb,
              var(--text-muted) 9%,
              var(--panel-raised)
            ),
            var(--panel-raised)
          );

      }


      /* ==========================================================
         IMAGE PHOTO
         ========================================================== */

      .card-image-photo {

        position:
          absolute;

        inset:
          0;

        width:
          100%;

        height:
          100%;

        object-fit:
          cover;

        display:
          block;

        z-index:
          2;

        background:
          var(--panel-raised);

        transition:
          transform .25s ease,
          opacity .25s ease;

      }


      .anomalie-card:hover
      .card-image-photo {

        transform:
          scale(1.035);

      }


      /* ==========================================================
         SVG FALLBACK
         ========================================================== */

      .card-image-icon {

        width:
          52px;

        height:
          52px;

        display:
          inline-flex;

        align-items:
          center;

        justify-content:
          center;

        color:
          var(--accent-primary);

        opacity:
          .8;

        position:
          relative;

        z-index:
          1;

        transition:
          transform .2s ease;

      }


      .card-image-icon svg {

        width:
          100%;

        height:
          100%;

      }


      .anomalie-card:hover
      .card-image-icon {

        transform:
          scale(1.08);

      }


      .image-type-label {

        position:
          relative;

        z-index:
          1;

        color:
          var(--text-muted);

        font-family:
          var(--font-mono);

        font-size:
          8px;

        font-weight:
          700;

        letter-spacing:
          .12em;

        text-transform:
          uppercase;

      }


      /* ==========================================================
         TOP
         ========================================================== */

      .card-top {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          10px;

        padding:
          12px
          14px
          4px;

      }


      .type-badge {

        min-width:
          0;

        overflow:
          hidden;

        text-overflow:
          ellipsis;

        color:
          var(--text-primary);

        font-family:
          var(--font-mono);

        font-size:
          12px;

        font-weight:
          800;

        letter-spacing:
          .02em;

      }


      /* ==========================================================
         CRITICALITY
         ========================================================== */

      .criticite-badge {

        flex:
          0 0 auto;

      }


      .criticite-badge[data-level='FAIBLE'] {

        background:
          color-mix(
            in srgb,
            var(--accent-primary) 11%,
            transparent
          );

        color:
          var(--accent-primary);

      }


      .criticite-badge[data-level='MOYENNE'] {

        background:
          color-mix(
            in srgb,
            var(--accent-warning) 12%,
            transparent
          );

        color:
          var(--accent-warning);

      }


      .criticite-badge[data-level='HAUTE'] {

        background:
          color-mix(
            in srgb,
            var(--accent-critical) 12%,
            transparent
          );

        color:
          var(--accent-critical);

      }


      .criticite-badge[data-level='CRITIQUE'] {

        background:
          color-mix(
            in srgb,
            var(--accent-critical) 20%,
            transparent
          );

        color:
          var(--accent-critical);

      }


      /* ==========================================================
         META
         ========================================================== */

      .card-meta {

        display:
          flex;

        flex-direction:
          column;

        gap:
          3px;

        padding:
          4px
          14px;

        font-size:
          12px;

        color:
          var(--text-muted);

      }


      .coords {

        font-size:
          11px;

        opacity:
          .8;

      }


      /* ==========================================================
         FOOTER
         ========================================================== */

      .card-footer {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        padding:
          10px
          14px
          14px;

        margin-top:
          auto;

        gap:
          8px;

      }


      /* ==========================================================
         STATUS
         ========================================================== */

      .statut-badge[data-statut='NOUVELLE'] {

        background:
          color-mix(
            in srgb,
            var(--accent-critical) 11%,
            transparent
          );

        color:
          var(--accent-critical);

      }


      .statut-badge[data-statut='EN_COURS'] {

        background:
          color-mix(
            in srgb,
            var(--accent-warning) 12%,
            transparent
          );

        color:
          var(--accent-warning);

      }


      .statut-badge[data-statut='RESOLUE'] {

        background:
          color-mix(
            in srgb,
            var(--accent-active) 11%,
            transparent
          );

        color:
          var(--accent-active);

      }


      /* ==========================================================
         RETRY
         ========================================================== */

      .retry-btn {

        margin-top:
          4px;

        padding:
          7px
          16px;

        border-radius:
          8px;

        border:
          1px solid
          var(--border-subtle);

        background:
          var(--panel-base);

        color:
          var(--text-primary);

        font-size:
          12.5px;

        font-weight:
          600;

        cursor:
          pointer;

        transition:
          background .15s ease,
          border-color .15s ease,
          color .15s ease;

      }


      .retry-btn:hover {

        background:
          var(--panel-raised);

        border-color:
          var(--accent-primary);

        color:
          var(--accent-primary);

      }


      /* ==========================================================
         MOBILE
         ========================================================== */

      @media (max-width: 700px) {

        .anomalies-grid {

          grid-template-columns:
            1fr;

        }

        .card-image {

          height:
            190px;

        }

      }

    `
  ]
})
export class AnomaliesComponent
  implements OnInit {


  private http =
    inject(HttpClient);


  private sanitizer =
    inject(DomSanitizer);


  /*
   * Backend origin.
   */

  private readonly API_ORIGIN =
    'https://stage-enova-3.onrender.com';


  anomalies: Anomalie[] = [];


  loading =
    true;


  loadError =
    false;


  statutFilter =
    '';


  criticiteFilter =
    '';


  /*
   * REAL image failures.
   */

  private brokenImages =
    new Set<number>();


  /*
   * GENERIC image failures.
   */

  private brokenTypeImages =
    new Set<number>();


  ngOnInit(): void {

    this.load();

  }


  /* ==============================================================
     LOAD
     ============================================================== */

  load(): void {

    this.loading =
      true;

    this.loadError =
      false;

    this.brokenImages.clear();

    this.brokenTypeImages.clear();


    let url =
      `${this.API_ORIGIN}/api/anomalies`;


    const params: string[] =
      [];


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

      url +=
        `?${params.join('&')}`;

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

                genericImageUrl:
                  this.typeImageUrl(a)
              }
            );

          });


          this.anomalies =
            data;

          this.loading =
            false;

        },


        error: (error) => {

          console.error(
            '[ANOMALIES] API error:',
            error
          );

          this.loading =
            false;

          this.loadError =
            true;

        }

      });

  }


  /* ==============================================================
     FILTERS
     ============================================================== */

  filterStatut(
    event: Event
  ): void {

    this.statutFilter =
      (
        event.target as
        HTMLSelectElement
      ).value;

    this.load();

  }


  filterCriticite(
    event: Event
  ): void {

    this.criticiteFilter =
      (
        event.target as
        HTMLSelectElement
      ).value;

    this.load();

  }


  /* ==============================================================
     STATUS LABEL
     ============================================================== */

  statutLabel(
    status: string
  ): string {

    switch (status) {

      case 'NOUVELLE':
        return 'New';

      case 'EN_COURS':
        return 'In progress';

      case 'RESOLUE':
        return 'Resolved';

      default:
        return status ||
          'Unknown';

    }

  }


  /* ==============================================================
     CRITICALITY LABEL
     ============================================================== */

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
        return criticite ||
          'Unknown';

    }

  }


  /* ==============================================================
     NORMALIZE OBJECT TYPE
     ============================================================== */

  getObjectType(
    type:
      string |
      null |
      undefined
  ): string {

    return (
      type ??
      'unknown'
    )
      .trim()
      .toLowerCase();

  }


  /* ==============================================================
     REAL IMAGE URL
     ============================================================== */

  private buildImageUrl(
    a: Anomalie
  ): string | null {


    let path:
      string |
      null =
      null;


    /*
     * Direct image URL.
     */

    if (
      a.imageUrl &&
      a.imageUrl.trim()
    ) {

      path =
        a.imageUrl.trim();

    }


    /*
     * Direct photo URL.
     */

    else if (
      a.photoUrl &&
      a.photoUrl.trim()
    ) {

      path =
        a.photoUrl.trim();

    }


    /*
     * Backend path.
     */

    else if (
      a.imageFilePath &&
      a.imageFilePath.trim()
    ) {

      path =
        a.imageFilePath.trim();

    }


    /*
     * Filename.
     */

    else if (
      a.imageFileName &&
      a.imageFileName.trim()
    ) {

      path =
        `/images/detections/${a.imageFileName.trim()}`;

    }


    if (!path) {

      return null;

    }


    /*
     * Absolute URL.
     */

    if (
      path.startsWith('http://') ||
      path.startsWith('https://')
    ) {

      return path;

    }


    /*
     * Normalize path.
     */

    if (
      !path.startsWith('/')
    ) {

      path =
        `/${path}`;

    }


    return (
      `${this.API_ORIGIN}${path}`
    );

  }


  /* ==============================================================
     REAL IMAGE
     ============================================================== */

  imageUrl(
    a: Anomalie
  ): string | null {

    if (
      this.brokenImages.has(
        a.id
      )
    ) {

      return null;

    }


    return this.buildImageUrl(a);

  }


  /* ==============================================================
     GENERIC IMAGE
     ============================================================== */

  typeImageUrl(
    a: Anomalie
  ): string | null {

    if (
      this.brokenTypeImages.has(
        a.id
      )
    ) {

      return null;

    }


    const key =
      this.getObjectType(
        a.objectDetected
      );


    const file =
      TYPE_IMAGE_FILE[key];


    /*
     * IMPORTANT:
     *
     * If there is no generic image
     * for this object type, return null.
     *
     * This causes Angular to use
     * the SVG fallback.
     */

    if (!file) {

      return null;

    }


    return (
      `${this.API_ORIGIN}` +
      `/images/detections/` +
      `${file}`
    );

  }


  /* ==============================================================
     IMAGE LOADED
     ============================================================== */

  onImageLoad(
    id: number,
    level:
      'photo' |
      'type'
  ): void {

    console.log(
      `[ANOMALIES] ${level} image loaded successfully for anomaly ${id}`
    );

  }


  /* ==============================================================
     IMAGE ERROR
     ============================================================== */

  onImageError(
    event: Event,
    id: number,
    level:
      'photo' |
      'type'
  ): void {

    const img =
      event.target as
      HTMLImageElement;


    console.error(
      `[ANOMALIES] ${level} image FAILED for anomaly ${id}:`,
      img?.src
    );


    /*
     * REAL PHOTO FAILED.
     *
     * Hide it.
     *
     * Angular will then attempt
     * the generic image.
     */

    if (
      level === 'photo'
    ) {

      this.brokenImages.add(id);

      return;

    }


    /*
     * GENERIC IMAGE FAILED.
     *
     * Hide it.
     *
     * Angular will then use
     * the SVG icon.
     */

    this.brokenTypeImages.add(id);

  }


  /* ==============================================================
     SVG FALLBACK
     ============================================================== */

  objectIcon(
    type:
      string |
      null |
      undefined
  ): SafeHtml {

    return getSafeAnomalyIcon(
      this.sanitizer,
      type
    );

  }

}