import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type KpiTone = 'neutral' | 'good' | 'warning' | 'critical';

/**
 * Tuile KPI, style epure : carte plane (fond panel, bordure fine), une
 * icone dans une pastille de couleur douce en haut, puis la valeur en
 * grand. Le ton (good/warning/critical/neutral) ne colore que la pastille
 * et la valeur, jamais toute la carte - le fond reste neutre pour rester
 * lisible et calme visuellement, y compris quand plusieurs cartes
 * "warning"/"critical" sont affichees en meme temps.
 *
 * La valeur numerique s'anime (count-up) a chaque changement au lieu de
 * sauter directement au nouveau chiffre, pour que les rafraichissements
 * automatiques du dashboard restent lisibles et vivants plutot que de
 * faire "clignoter" les chiffres.
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-card" [class]="'tone-' + tone">
      <div class="kpi-top">
        <span class="kpi-icon-chip" aria-hidden="true" *ngIf="!hideIcon" [innerHTML]="iconHtml"></span>
        <span class="kpi-visual" *ngIf="hideIcon"><ng-content select="[kpi-visual]"></ng-content></span>
        <span class="kpi-label">{{ label }}</span>
      </div>
      <div class="kpi-main">
        <div class="kpi-value">
          {{ displayValue }}<span class="kpi-unit" *ngIf="unit">{{ unit }}</span>
        </div>
        <div class="kpi-trend" *ngIf="trend" [class]="'trend-' + (trendDir || 'up')">
          <svg *ngIf="trendDir === 'up'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
          <svg *ngIf="trendDir === 'down'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          <span>{{ trend }}</span>
        </div>
      </div>
      <div class="kpi-sub" *ngIf="sublabel">{{ sublabel }}</div>
    </div>
  `,
  styles: [`
    .kpi-card {
      position: relative;
      border-radius: 16px;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: var(--panel-base);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-card);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card-hover);
      border-color: color-mix(in srgb, var(--accent-primary) 30%, var(--border-subtle));
    }

    .kpi-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .kpi-icon-chip {
      width: 38px;
      height: 38px;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      padding: 9px;
      transition: transform 0.2s ease;
    }

    .kpi-card:hover .kpi-icon-chip {
      transform: scale(1.05);
    }

    .kpi-icon-chip ::ng-deep svg {
      width: 100%;
      height: 100%;
    }

    .kpi-visual {
      flex-shrink: 0;
      display: inline-flex;
    }

    .tone-neutral .kpi-icon-chip { background: var(--accent-primary-soft); color: var(--accent-primary); }
    .tone-good .kpi-icon-chip { background: rgba(31, 167, 107, 0.12); color: #1FA76B; }
    .tone-warning .kpi-icon-chip { background: color-mix(in srgb, var(--accent-warning) 14%, transparent); color: var(--accent-warning); }
    .tone-critical .kpi-icon-chip { background: rgba(229, 72, 77, 0.12); color: var(--accent-critical); }

    :root[data-theme='dark'] .tone-good .kpi-icon-chip { color: #1FC9BA; background: rgba(31, 201, 186, 0.14); }

    .kpi-label {
      font-size: 13px;
      letter-spacing: 0.01em;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .kpi-main {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }

    .kpi-value {
      font-family: var(--font-mono);
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }

    .tone-critical .kpi-value { color: var(--accent-critical); }

    .kpi-unit {
      font-size: 14px;
      font-weight: 500;
      margin-left: 4px;
      color: var(--text-muted);
    }

    .kpi-trend {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 700;
      font-family: var(--font-mono);
      line-height: 1;
      flex-shrink: 0;
    }

    .trend-up {
      background: rgba(31, 167, 107, 0.12);
      color: #16935C;
    }

    :root[data-theme='dark'] .trend-up {
      background: rgba(31, 201, 186, 0.16);
      color: #1FC9BA;
    }

    .trend-down {
      background: rgba(229, 72, 77, 0.12);
      color: #E5484D;
    }

    .trend-neutral {
      background: var(--panel-raised);
      color: var(--text-secondary);
    }

    .kpi-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: -2px;
    }
  `],
})
export class KpiCardComponent implements OnChanges {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() unit?: string;
  @Input() sublabel?: string;
  @Input() tone: KpiTone = 'neutral';
  @Input() trend?: string;
  @Input() trendDir?: 'up' | 'down' | 'neutral';
  @Input() icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="9" rx="1.2"/><rect x="14" y="3" width="7" height="5" rx="1.2"/><rect x="14" y="12" width="7" height="9" rx="1.2"/><rect x="3" y="16" width="7" height="5" rx="1.2"/></svg>';
  @Input() hideIcon = false;

  /** `icon` ne recoit jamais de contenu venant de l'utilisateur (toujours un SVG fixe defini dans le code) :
   * on peut donc le rendre en confiance sans risque d'injection. */
  get iconHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.icon);
  }

  constructor(private sanitizer: DomSanitizer) {}

  /** Ce qui est reellement affiche : anime progressivement vers `value` quand celui-ci est numerique. */
  displayValue: string | number = '';

  private animationFrame?: number;
  private readonly reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['value']) return;

    const from = this.parseNumeric(changes['value'].previousValue);
    const to = this.parseNumeric(this.value);

    if (from === null || to === null || this.reduceMotion) {
      // Valeur non numerique (ou mouvement reduit demande) : pas d'animation, affichage direct.
      this.displayValue = this.value;
      return;
    }

    this.animateTo(from, to, this.decimalsOf(this.value));
  }

  private parseNumeric(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private decimalsOf(v: unknown): number {
    const s = String(v);
    const dot = s.indexOf('.');
    return dot === -1 ? 0 : s.length - dot - 1;
  }

  private animateTo(from: number, to: number, decimals: number): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

    const duration = 600;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic — vif au depart, se pose en douceur
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      this.displayValue = decimals > 0 ? current.toFixed(decimals) : Math.round(current);

      if (t < 1) {
        this.animationFrame = requestAnimationFrame(step);
      }
    };

    this.animationFrame = requestAnimationFrame(step);
  }
}
