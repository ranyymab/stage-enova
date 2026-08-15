/**
 * Icones minimalistes par type d'objet detecte, utilisees partout ou une
 * anomalie doit etre representee visuellement sans photo reelle (ce qui est
 * desormais systematiquement le cas : voir DataSeeder/RobotSimulationService,
 * qui ne referencent plus jamais de fichier image inexistant). Un seul
 * endroit pour ces SVG, importe par : anomalies.component.ts, le tableau
 * du dashboard, et les popups d'anomalie de live-map.component.ts.
 *
 * "obstacle" reutilise volontairement l'icone "default" (inconnu) : le
 * robot ne classifie pas ce type plus precisement, il n'y a donc pas plus
 * d'information a representer visuellement qu'un type non reconnu.
 */
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export const ANOMALY_ICONS: Record<string, string> = {
  person:
    '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>',
  vehicle:
    '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l1.5-5A2 2 0 0 1 6.4 6.5h11.2A2 2 0 0 1 19.5 8L21 13"/><rect x="2.5" y="13" width="19" height="5" rx="1.5"/><circle cx="7" cy="18.5" r="1.6"/><circle cx="17" cy="18.5" r="1.6"/></svg>',
  animal:
    '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15.5" r="4.2"/><circle cx="6.5" cy="8.5" r="1.9"/><circle cx="17.5" cy="8.5" r="1.9"/><circle cx="9.3" cy="5.3" r="1.7"/><circle cx="14.7" cy="5.3" r="1.7"/></svg>',
  obstacle:
    '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 9.5v4"/><circle cx="12" cy="16.2" r="0.6" fill="currentColor"/></svg>',
  debris:
    '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8l4-3 4 2 4-2 4 3-1 11H5z"/><path d="M8 9v9M12 9v9M16 9v9"/></svg>',
  default:
    '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.3 1-1.3 1.9"/><circle cx="12" cy="16.8" r="0.4" fill="currentColor"/></svg>',
};

export function getAnomalyIcon(type: string | null | undefined): string {
  return ANOMALY_ICONS[(type ?? '').toLowerCase()] ?? ANOMALY_ICONS['default'];
}

/**
 * Version "prete pour [innerHTML]" de getAnomalyIcon : Angular sanitize par
 * defaut tout ce qui passe par [innerHTML], et son sanitizer HTML retire
 * purement et simplement les balises <svg> (elles ne sont pas dans sa liste
 * blanche). Sans passer par bypassSecurityTrustHtml, ces icones sont donc
 * silencieusement supprimees a l'affichage - la case reste vide, sans
 * erreur console visible. On centralise donc le bypass ici : le SVG vient
 * toujours du code (jamais d'une entree utilisateur), donc aucun risque
 * d'injection.
 */
export function getSafeAnomalyIcon(sanitizer: DomSanitizer, type: string | null | undefined): SafeHtml {
  return sanitizer.bypassSecurityTrustHtml(getAnomalyIcon(type));
}
