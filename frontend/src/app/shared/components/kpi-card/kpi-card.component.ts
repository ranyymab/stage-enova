import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type KpiTone = 'neutral' | 'good' | 'warning' | 'critical';

/**
 * Tuile KPI dans le style "Berry" : bloc de couleur pleine avec degrade,
 * icone en filigrane, valeur en grand. Le ton (good/warning/critical/
 * neutral) determine le degrade utilise.
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
      <span class="kpi-icon" aria-hidden="true" *ngIf="!hideIcon" [innerHTML]="iconHtml"></span>
      <span class="kpi-visual" *ngIf="hideIcon"><ng-content select="[kpi-visual]"></ng-content></span>
      <div class="kpi-top">
        <span class="kpi-label">{{ label }}</span>
      </div>
      <div class="kpi-value">{{ displayValue }}<span class="kpi-unit" *ngIf="unit">{{ unit }}</span></div>
      <div class="kpi-sub" *ngIf="sublabel">{{ sublabel }}</div>
    </div>
  `,
  styles: [`
    .kpi-card {
      position: relative;
      overflow: hidden;
      border-radius: 14px;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      color: #fff;
      box-shadow: var(--shadow-card);
      transition: box-shadow 0.25s ease, transform 0.25s ease;
      will-change: transform;
      background-size: 180% 180%;
      animation: kpiGradientDrift 9s ease-in-out infinite;
    }

    @keyframes kpiGradientDrift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    /* Diagonal shine that sweeps across on hover */
    .kpi-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.16) 35%, transparent 50%);
      transform: translateX(-120%);
      transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }

    .kpi-card:hover::before {
      transform: translateX(120%);
    }

    .kpi-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-3px);
    }

    .kpi-card:hover .kpi-icon {
      transform: scale(1.08) rotate(-4deg);
      opacity: 0.4;
      animation-play-state: paused;
    }

    .tone-neutral { background-image: linear-gradient(135deg, #007E74 0%, #00AEA0 100%); }
    .tone-good { background-image: linear-gradient(135deg, #00AEA0 0%, #3FD6C4 100%); }
    .tone-warning { background-image: linear-gradient(135deg, #A8420E 0%, #CA5215 100%); }
    .tone-critical {
      background-image: linear-gradient(135deg, #D32F4B 0%, #FF5252 100%);
      animation: kpiGradientDrift 9s ease-in-out infinite, kpiCriticalPulse 2.2s ease-in-out infinite;
    }

    @keyframes kpiCriticalPulse {
      0%, 100% { box-shadow: var(--shadow-card), 0 0 0 0 rgba(255, 82, 82, 0.35); }
      50% { box-shadow: var(--shadow-card), 0 0 0 8px rgba(255, 82, 82, 0); }
    }

    .kpi-icon {
      position: absolute;
      top: 14px;
      right: 16px;
      width: 34px;
      height: 34px;
      display: inline-flex;
      color: #fff;
      opacity: 0.28;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
      animation: kpiIconFloat 4s ease-in-out infinite;
    }

    @keyframes kpiIconFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }

    .kpi-visual {
      position: absolute;
      top: 12px;
      right: 14px;
      display: inline-flex;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .kpi-card:hover .kpi-visual {
      transform: scale(1.08);
    }

    .kpi-top {
      display: flex;
      align-items: baseline;
    }

    .kpi-label {
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 600;
    }

    .kpi-value {
      font-family: var(--font-mono);
      font-size: 30px;
      font-weight: 700;
      color: #fff;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
    }

    .kpi-unit {
      font-size: 14px;
      font-weight: 500;
      margin-left: 3px;
      opacity: 0.85;
    }

    .kpi-sub {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    }

    @media (prefers-reduced-motion: reduce) {
      .kpi-card, .kpi-card::before, .kpi-icon {
        transition: none !important;
        animation: none !important;
      }
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
