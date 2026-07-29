import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionStatut } from '../../models/dashboard.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-badge" [class.is-mission]="statut === 'EN_MISSION' || statut === 'EN_TELEPORTATION' || modeRobot === 'TELEPORTATION' || modeRobot === 'TELEPORTATION_URGENCE'" [class.is-teleop]="statut === 'EN_TELEPORTATION' || modeRobot === 'TELEPORTATION' || modeRobot === 'TELEPORTATION_URGENCE'" [class.is-retour]="statut === 'RETOUR_BASE' || modeRobot === 'RETOUR_BASE'">
      <span class="dot"></span>
      <span class="label">{{ modeRobot === 'TELEPORTATION_URGENCE' ? 'MODE TELEPORTATION URGENCE' : modeRobot === 'TELEPORTATION' ? 'MODE TELEPORTATION' : (statut === 'RETOUR_BASE' || modeRobot === 'RETOUR_BASE') ? 'RETOUR A LA BASE' : statut === 'EN_MISSION' ? 'EN MISSION' : statut === 'EN_TELEPORTATION' ? 'TELEPORTATION' : 'MODE AUTONOME' }}</span>
      <span class="mission-name" *ngIf="missionEnCours">{{ missionEnCours }}</span>
    </div>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      border-radius: 6px;
      background: var(--panel-raised);
      border: 1px solid var(--border-subtle);
      font-family: var(--font-mono);
      font-size: 13px;
      letter-spacing: 0.04em;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-muted);
      flex-shrink: 0;
    }

    .is-mission .dot {
      background: var(--accent-active);
      box-shadow: 0 0 0 0 rgba(61, 220, 151, 0.6);
      animation: pulse 2s infinite;
    }

    .is-teleop .dot {
      background: var(--accent-critical);
      box-shadow: 0 0 0 0 rgba(229, 72, 77, 0.6);
      animation: pulse 2s infinite;
    }

    .is-retour .dot {
      background: #F2A93B;
      box-shadow: 0 0 0 0 rgba(242, 169, 59, 0.6);
      animation: pulse 2s infinite;
    }

    .is-mission .label {
      color: var(--accent-active);
    }

    .is-teleop .label {
      color: var(--accent-critical);
    }

    .is-retour .label {
      color: #F2A93B;
    }

    .label {
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .mission-name {
      color: var(--text-secondary);
      padding-left: 8px;
      border-left: 1px solid var(--border-subtle);
      font-size: 12px;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(61, 220, 151, 0.5); }
      70% { box-shadow: 0 0 0 8px rgba(61, 220, 151, 0); }
      100% { box-shadow: 0 0 0 0 rgba(61, 220, 151, 0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .is-mission .dot { animation: none; }
    }
  `],
})
export class StatusBadgeComponent {
  @Input() statut: MissionStatut = 'EN_REPOS';
  @Input() missionEnCours: string | null = null;
  @Input() modeRobot: 'AUTONOME' | 'TELEPORTATION' | 'TELEPORTATION_URGENCE' | 'RETOUR_BASE' = 'AUTONOME';
}
