import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Anneau de batterie anime en SVG. Le trait se remplit progressivement
 * jusqu'au pourcentage courant (via stroke-dashoffset anime en CSS), et
 * s'anime a nouveau a chaque changement de valeur (rafraichissement auto
 * du dashboard toutes les 30s) plutot que de sauter directement.
 */
@Component({
  selector: 'app-battery-ring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" [style.width.px]="size" [style.height.px]="size" class="ring">
      <circle
        [attr.cx]="size / 2" [attr.cy]="size / 2" [attr.r]="radius"
        class="ring-track" [attr.stroke-width]="strokeWidth" fill="none" />
      <circle
        [attr.cx]="size / 2" [attr.cy]="size / 2" [attr.r]="radius"
        class="ring-fill" [class.is-critical]="percent < 30" [class.is-charging]="charging"
        fill="none" [attr.stroke-width]="strokeWidth"
        [attr.stroke-dasharray]="circumference"
        [style.stroke-dashoffset.px]="dashOffset"
        transform-origin="center"
        [attr.transform]="'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'" />
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; position: relative; }
    .ring-track { stroke: var(--border-subtle); }
    .ring-fill {
      stroke: var(--accent-primary);
      stroke-linecap: round;
      transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
    }
    .ring-fill.is-critical { stroke: var(--accent-critical); }
    .ring-fill.is-charging {
      animation: ringCharging 1.6s ease-in-out infinite;
    }

    @keyframes ringCharging {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.55; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ring-fill { transition: none; animation: none !important; }
    }
  `],
})
export class BatteryRingComponent implements OnChanges {
  @Input() percent = 0;
  @Input() charging = false;
  @Input() size = 40;

  strokeWidth = 4;
  radius = (this.size - this.strokeWidth) / 2;
  circumference = 2 * Math.PI * this.radius;
  dashOffset = this.circumference;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['size']) {
      this.radius = (this.size - this.strokeWidth) / 2;
      this.circumference = 2 * Math.PI * this.radius;
    }
    const clamped = Math.max(0, Math.min(100, this.percent || 0));
    // Decalage du trait pointille : 0% -> offset plein cercle (rien de visible), 100% -> offset 0 (cercle complet).
    this.dashOffset = this.circumference * (1 - clamped / 100);
  }
}
