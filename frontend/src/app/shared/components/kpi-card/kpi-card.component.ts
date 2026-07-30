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
      <div class="kpi-value">{{ displayValue }}<span class="kpi-unit" *ngIf="unit">{{ unit }}</span></div>
      <div class="kpi-sub" *ngIf="sublabel">{{ sublabel }}</div>
    </div>
  `,
  styles: [`
    .kpi-card {
      position: relative;
      border-radius: 14px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--panel-base);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-card);
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .kpi-card:hover {
      box-shadow: var(--shadow-card-hover);
      border-color: color-mix(in srgb, var(--accent-primary) 25%, var(--border-subtle));
    }

    .kpi-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .kpi-icon-chip {
      width: 34px;
      height: 34px;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      padding: 8px;
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
    .tone-good .kpi-icon-chip { background: rgba(61, 220, 151, 0.14); color: #1FA76B; }
    .tone-warning .kpi-icon-chip { background: color-mix(in srgb, var(--accent-warning) 14%, transparent); color: var(--accent-warning); }
    .tone-critical .kpi-icon-chip { background: rgba(229, 72, 77, 0.12); color: var(--accent-critical); }

    :root[data-theme='dark'] .tone-good .kpi-icon-chip { color: #3DDC97; }

    .kpi-label {
      font-size: 12px;
      letter-spacing: 0.01em;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .kpi-value {
      font-family: var(--font-mono);
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
    }

    .tone-critical .kpi-value { color: var(--accent-critical); }

    .kpi-unit {
      font-size: 13px;
      font-weight: 500;
      margin-left: 3px;
      color: var(--text-muted);
    }

    .kpi-sub {
      font-size: 12px;
      color: var(--text-muted);
    }
  `],
})
export class KpiCardComponent implements OnChanges {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() unit?: string;
  @Input() sublabel?: string;
  @Input() tone: KpiTone = 'neutral';
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
