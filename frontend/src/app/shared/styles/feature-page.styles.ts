/**
 * Styles partages par toutes les pages "feature" (Missions, Anomalies,
 * Kilometrage, Inspection, Teleoperation, Docking).
 *
 * But : une seule source de verite pour le chrome commun (en-tete, nav de
 * date, panels, tableaux, pills, etats vide/chargement, animations) afin que
 * toutes les pages restent visuellement identiques au tableau de bord, sans
 * dupliquer le CSS dans chaque composant. Chaque page importe cette
 * constante en premier element de son tableau `styles`, puis ajoute ses
 * regles propres a la suite.
 */
export const FEATURE_PAGE_STYLES = `
  .page {
    padding: 26px 30px 44px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1360px;
    animation: pageFadeIn 0.35s ease both;
  }

  @keyframes pageFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .page-header h1 {
    margin: 0;
    font-size: 21px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .page-sub {
    font-size: 13px;
    color: var(--text-muted);
    display: block;
    margin-top: 2px;
  }

  /* ---------- Navigation date / filtres ---------- */
  .date-nav, .filters {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .date-nav button,
  .nav-btn {
    background: var(--panel-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 5px 12px;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    transition: border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
  }

  .date-nav button:hover,
  .nav-btn:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }

  .date-nav button:active,
  .nav-btn:active {
    transform: scale(0.94);
  }

  .date-nav input[type='date'],
  .date-input {
    background: var(--panel-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    font-family: var(--font-mono);
  }

  select {
    background: var(--panel-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    padding: 7px 14px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
  }

  select:hover,
  select:focus {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    outline: none;
  }

  /* ---------- Cartes resume (KPI-like) ---------- */
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .summary-card {
    background: var(--panel-base);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: var(--shadow-card);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
    animation: cardRise 0.45s ease both;
  }

  .summary-card:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
  }

  .summary-cards .summary-card:nth-child(2) { animation-delay: 0.04s; }
  .summary-cards .summary-card:nth-child(3) { animation-delay: 0.08s; }
  .summary-cards .summary-card:nth-child(4) { animation-delay: 0.12s; }

  @keyframes cardRise {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-weight: 600;
  }

  .card-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--accent-active);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .card-value.late { color: var(--accent-critical); }
  .unit { font-size: 14px; color: var(--text-muted); font-weight: 500; }

  /* ---------- Panels & tableaux ---------- */
  .panel {
    background: var(--panel-base);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 20px 22px;
    box-shadow: var(--shadow-card);
    transition: box-shadow 0.2s ease;
    animation: cardRise 0.5s ease both;
    animation-delay: 0.1s;
  }

  .panel:hover { box-shadow: var(--shadow-card-hover); }

  .panel-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .panel-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .km-table, .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .km-table th, .data-table th {
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    padding: 0 12px 10px 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .km-table td, .data-table td {
    padding: 11px 12px 11px 0;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-secondary);
  }

  .km-table tr, .data-table tr {
    transition: background 0.12s ease;
    animation: rowFadeIn 0.35s ease both;
  }

  .km-table tbody tr:hover, .data-table tbody tr:hover {
    background: var(--panel-raised);
  }

  .km-table tr:last-child td, .data-table tr:last-child td {
    border-bottom: none;
  }

  @keyframes rowFadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .row-late { background: color-mix(in srgb, var(--accent-critical) 6%, transparent); }

  .mono { font-family: var(--font-mono); }
  .bold { color: var(--text-primary) !important; font-weight: 600; }
  .small { font-size: 11px; }
  .muted { color: var(--text-muted); }

  /* ---------- Pills generiques ---------- */
  .delay-pill, .type-pill, .cat-pill, .criticite-badge, .statut-badge, .type-badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .delay-pill { background: rgba(61, 220, 151, 0.15); color: var(--accent-active); }
  .delay-pill.is-late { background: rgba(229, 72, 77, 0.15); color: var(--accent-critical); }

  /* ---------- Etats vide / chargement ---------- */
  .empty {
    color: var(--text-muted);
    font-size: 13.5px;
    padding: 48px 20px;
    text-align: center;
    border: 1px dashed var(--border-subtle);
    border-radius: 12px;
  }

  .loading {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 8px 0;
  }

  .skeleton-row {
    height: 38px;
    border-radius: 8px;
    background: linear-gradient(90deg, var(--panel-raised) 25%, var(--border-subtle) 50%, var(--panel-raised) 75%);
    background-size: 200% 100%;
    animation: skeletonShimmer 1.4s ease-in-out infinite;
  }

  @keyframes skeletonShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .page, .summary-card, .panel, .km-table tr, .data-table tr {
      animation: none;
    }
    .skeleton-row { animation: none; opacity: 0.6; }
  }

  @media (max-width: 1100px) {
    .summary-cards { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 640px) {
    .page-header { flex-direction: column; align-items: flex-start; }
    .summary-cards { grid-template-columns: 1fr; }
  }
`;
