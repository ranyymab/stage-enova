
export const FEATURE_PAGE_STYLES = `

  /* ================================================================
     PAGE
     ================================================================ */

  .page {
    width: 100%;
    min-height: 100%;
    box-sizing: border-box;

    padding: 28px 32px 48px;

    display: flex;
    flex-direction: column;
    gap: 22px;

    max-width: none;
    margin: 0;

    animation: pageFadeIn .35s ease both;
  }


  @keyframes pageFadeIn {
    from {
      opacity: 0;
      transform: translateY(7px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }


  /* ================================================================
     PAGE HEADER
     ================================================================ */

  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    padding-bottom: 2px;
  }


  .page-header h1 {
    margin: 0;

    color: var(--text-primary);

    font-family:
      Inter,
      Arial,
      Helvetica,
      sans-serif;

    font-size: 25px;
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -.035em;
  }


  .page-header h1::before {
    content: '';

    display: inline-block;

    width: 24px;
    height: 2px;

    margin-right: 10px;
    margin-bottom: 6px;

    vertical-align: middle;

    background: var(--accent-primary);
    border-radius: 2px;

    box-shadow:
      0 0 10px
      color-mix(
        in srgb,
        var(--accent-primary) 50%,
        transparent
      );
  }


  .page-sub {
    display: block;

    margin-top: 7px;

    color: var(--text-muted);

    font-size: 12.5px;
    line-height: 1.5;
    font-weight: 450;
  }


  /* ================================================================
     HEADER ACTIONS
     ================================================================ */

  .page-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }


  /* ================================================================
     DATE NAVIGATION / FILTERS
     ================================================================ */

  .date-nav,
  .filters {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }


  .date-nav button,
  .nav-btn {
    min-width: 36px;
    height: 34px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0 10px;

    color: var(--text-secondary);
    background: var(--panel-base);

    border: 1px solid var(--border-subtle);
    border-radius: 8px;

    cursor: pointer;

    font-size: 17px;
    line-height: 1;

    transition:
      color .16s ease,
      background .16s ease,
      border-color .16s ease,
      transform .12s ease,
      box-shadow .16s ease;
  }


  .date-nav button:hover,
  .nav-btn:hover {
    color: var(--accent-primary);

    background: var(--panel-raised);

    border-color:
      color-mix(
        in srgb,
        var(--accent-primary) 45%,
        var(--border-subtle)
      );

    box-shadow:
      0 5px 18px
      rgba(30, 90, 160, .08);
  }


  .date-nav button:active,
  .nav-btn:active {
    transform: scale(.95);
  }


  .date-nav input[type='date'],
  .date-input {
    height: 34px;
    box-sizing: border-box;

    padding: 0 11px;

    color: var(--text-primary);
    background: var(--panel-base);

    border: 1px solid var(--border-subtle);
    border-radius: 8px;

    font-family: var(--font-mono);
    font-size: 11.5px;

    transition:
      border-color .16s ease,
      box-shadow .16s ease;
  }


  .date-nav input[type='date']:hover,
  .date-input:hover {
    border-color:
      color-mix(
        in srgb,
        var(--accent-primary) 40%,
        var(--border-subtle)
      );
  }


  .date-nav input[type='date']:focus,
  .date-input:focus {
    outline: none;

    border-color: var(--accent-primary);

    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--accent-primary) 12%,
        transparent
      );
  }


  /* ================================================================
     SELECTS
     ================================================================ */

  select {
    min-height: 34px;
    box-sizing: border-box;

    padding: 0 30px 0 12px;

    color: var(--text-primary);
    background: var(--panel-base);

    border: 1px solid var(--border-subtle);
    border-radius: 8px;

    font-family:
      Inter,
      Arial,
      sans-serif;

    font-size: 11.5px;
    font-weight: 600;

    cursor: pointer;

    transition:
      border-color .16s ease,
      color .16s ease,
      box-shadow .16s ease;
  }


  select:hover,
  select:focus {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    outline: none;
  }


  select:focus {
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--accent-primary) 10%,
        transparent
      );
  }


  /* ================================================================
     SUMMARY / KPI CARDS
     ================================================================ */

  .summary-cards {
    display: grid;

    grid-template-columns:
      repeat(4, minmax(0, 1fr));

    gap: 13px;
  }


  .summary-card {
    position: relative;
    overflow: hidden;

    min-width: 0;

    background: var(--panel-base);

    border: 1px solid var(--border-subtle);
    border-radius: 13px;

    padding: 17px 18px;

    display: flex;
    flex-direction: column;
    gap: 7px;

    box-shadow: var(--shadow-card);

    transition:
      border-color .2s ease,
      box-shadow .2s ease,
      transform .2s ease;

    animation:
      cardRise
      .45s
      ease
      both;
  }


  .summary-card::before {
    content: '';

    position: absolute;

    top: 0;
    left: 0;
    right: 0;

    height: 2px;

    opacity: .8;

    background:
      linear-gradient(
        90deg,
        var(--accent-primary),
        transparent 80%
      );
  }


  .summary-card::after {
    content: '';

    position: absolute;

    width: 120px;
    height: 120px;

    right: -65px;
    top: -65px;

    border-radius: 50%;

    background:
      color-mix(
        in srgb,
        var(--accent-primary) 6%,
        transparent
      );

    pointer-events: none;
  }


  .summary-card:hover {
    border-color:
      color-mix(
        in srgb,
        var(--accent-primary) 28%,
        var(--border-subtle)
      );

    box-shadow: var(--shadow-card-hover);

    transform: translateY(-2px);
  }


  .summary-cards
  .summary-card:nth-child(2) {
    animation-delay: .04s;
  }


  .summary-cards
  .summary-card:nth-child(3) {
    animation-delay: .08s;
  }


  .summary-cards
  .summary-card:nth-child(4) {
    animation-delay: .12s;
  }


  @keyframes cardRise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }


  .card-label {
    color: var(--text-muted);

    font-family: var(--font-mono);

    font-size: 8.5px;
    line-height: 1.3;

    text-transform: uppercase;
    letter-spacing: .13em;

    font-weight: 700;
  }


  .card-value {
    color: var(--accent-active);

    font-family: var(--font-mono);

    font-size: 27px;
    line-height: 1.1;

    font-weight: 800;

    font-variant-numeric: tabular-nums;

    letter-spacing: -.025em;
  }


  .card-value.late {
    color: var(--accent-critical);
  }


  .unit {
    margin-left: 3px;

    color: var(--text-muted);

    font-family:
      Inter,
      Arial,
      sans-serif;

    font-size: 12px;
    font-weight: 500;
  }


  /* ================================================================
     GENERIC PANELS
     ================================================================ */

  .panel {
    position: relative;

    min-width: 0;
    overflow: hidden;

    background: var(--panel-base);

    border: 1px solid var(--border-subtle);
    border-radius: 13px;

    padding: 19px 21px;

    box-shadow: var(--shadow-card);

    transition:
      border-color .2s ease,
      box-shadow .2s ease;

    animation:
      cardRise
      .5s
      ease
      both;

    animation-delay: .1s;
  }


  .panel:hover {
    border-color:
      color-mix(
        in srgb,
        var(--accent-primary) 17%,
        var(--border-subtle)
      );

    box-shadow: var(--shadow-card-hover);
  }


  .panel::before {
    content: '';

    position: absolute;

    left: 0;
    top: 0;

    width: 34px;
    height: 1px;

    background: var(--accent-primary);

    opacity: .65;
  }


  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;

    margin-bottom: 15px;
  }


  .panel-header h2 {
    margin: 0;

    color: var(--text-primary);

    font-size: 14px;
    line-height: 1.3;

    font-weight: 700;

    letter-spacing: -.01em;
  }


  .panel-header h2::before {
    content: '';

    display: inline-block;

    width: 5px;
    height: 5px;

    margin-right: 8px;
    margin-bottom: 2px;

    border-radius: 50%;

    background: var(--accent-primary);

    box-shadow:
      0 0 8px
      color-mix(
        in srgb,
        var(--accent-primary) 60%,
        transparent
      );
  }


  /* ================================================================
     PANEL ACTIONS
     ================================================================ */

  .panel-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }


  /* ================================================================
     TABLES
     ================================================================ */

  .km-table,
  .data-table {
    width: 100%;

    border-collapse: separate;
    border-spacing: 0;

    font-size: 12px;
  }


  .km-table th,
  .data-table th {
    text-align: left;

    color: var(--text-muted);

    padding:
      0
      12px
      10px
      0;

    border-bottom:
      1px solid
      var(--border-subtle);

    font-family: var(--font-mono);

    font-size: 8px;
    line-height: 1.2;

    text-transform: uppercase;
    letter-spacing: .12em;

    font-weight: 700;

    white-space: nowrap;
  }


  .km-table td,
  .data-table td {
    padding:
      11px
      12px
      11px
      0;

    color: var(--text-secondary);

    border-bottom:
      1px solid
      var(--border-subtle);

    vertical-align: middle;
  }


  .km-table tr,
  .data-table tr {
    transition: background .12s ease;

    animation:
      rowFadeIn
      .35s
      ease
      both;
  }


  .km-table tbody tr:hover,
  .data-table tbody tr:hover {
    background:
      color-mix(
        in srgb,
        var(--accent-primary) 4%,
        transparent
      );
  }


  .km-table tr:last-child td,
  .data-table tr:last-child td {
    border-bottom: none;
  }


  @keyframes rowFadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }


  .row-late {
    background:
      color-mix(
        in srgb,
        var(--accent-critical) 6%,
        transparent
      );
  }


  .row-late:hover {
    background:
      color-mix(
        in srgb,
        var(--accent-critical) 9%,
        transparent
      ) !important;
  }


  /* ================================================================
     TYPOGRAPHY HELPERS
     ================================================================ */

  .mono {
    font-family: var(--font-mono);

    font-variant-numeric:
      tabular-nums;
  }


  .bold {
    color: var(--text-primary) !important;
    font-weight: 700;
  }


  .small {
    font-size: 10px;
  }


  .muted {
    color: var(--text-muted);
  }


  /* ================================================================
     STATUS / TYPE PILLS
     ================================================================ */

  .delay-pill,
  .type-pill,
  .cat-pill,
  .criticite-badge,
  .statut-badge,
  .type-badge {
    min-height: 21px;

    box-sizing: border-box;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 3px 9px;

    border: 1px solid transparent;
    border-radius: 999px;

    font-family: var(--font-mono);

    font-size: 8px;
    line-height: 1;

    font-weight: 800;

    text-transform: uppercase;
    letter-spacing: .08em;

    white-space: nowrap;
  }


  .delay-pill {
    color: var(--accent-active);

    background:
      color-mix(
        in srgb,
        var(--accent-active) 10%,
        transparent
      );

    border-color:
      color-mix(
        in srgb,
        var(--accent-active) 18%,
        transparent
      );
  }


  .delay-pill.is-late {
    color: var(--accent-critical);

    background:
      color-mix(
        in srgb,
        var(--accent-critical) 10%,
        transparent
      );

    border-color:
      color-mix(
        in srgb,
        var(--accent-critical) 18%,
        transparent
      );
  }


  /* ================================================================
     COMMON BUTTONS
     ================================================================ */

  .btn-primary {
    min-height: 34px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    padding: 0 13px;

    color: #FFFFFF;

    background: var(--accent-primary);

    border:
      1px solid
      var(--accent-primary);

    border-radius: 7px;

    font-size: 10.5px;
    font-weight: 700;

    cursor: pointer;

    transition:
      transform .14s ease,
      box-shadow .18s ease,
      filter .18s ease;
  }


  .btn-primary:hover {
    filter: brightness(1.08);

    box-shadow:
      0 7px 20px
      color-mix(
        in srgb,
        var(--accent-primary) 24%,
        transparent
      );
  }


  .btn-primary:active {
    transform: scale(.97);
  }


  .btn-secondary {
    min-height: 34px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    padding: 0 13px;

    color: var(--text-secondary);

    background: var(--panel-raised);

    border:
      1px solid
      var(--border-subtle);

    border-radius: 7px;

    font-size: 10.5px;
    font-weight: 650;

    cursor: pointer;

    transition:
      color .16s ease,
      border-color .16s ease,
      background .16s ease;
  }


  .btn-secondary:hover {
    color: var(--accent-primary);

    border-color:
      color-mix(
        in srgb,
        var(--accent-primary) 35%,
        var(--border-subtle)
      );
  }


  /* ================================================================
     EMPTY STATE
     ================================================================ */

  .empty {
    min-height: 130px;

    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    gap: 8px;

    padding: 30px 20px;

    color: var(--text-muted);

    background:
      color-mix(
        in srgb,
        var(--panel-raised) 40%,
        transparent
      );

    border:
      1px dashed
      var(--border-subtle);

    border-radius: 10px;

    text-align: center;

    font-size: 12px;
  }


  .empty strong {
    color: var(--text-secondary);
    font-size: 12.5px;
  }


  /* ================================================================
     LOADING
     ================================================================ */

  .loading {
    display: flex;
    flex-direction: column;
    gap: 8px;

    padding: 5px 0;
  }


  .skeleton-row {
    height: 38px;

    border:
      1px solid
      var(--border-subtle);

    border-radius: 8px;

    background:
      linear-gradient(
        90deg,
        var(--panel-raised) 20%,
        color-mix(
          in srgb,
          var(--accent-primary) 7%,
          var(--panel-raised)
        ) 50%,
        var(--panel-raised) 80%
      );

    background-size:
      200%
      100%;

    animation:
      skeletonShimmer
      1.4s
      ease-in-out
      infinite;
  }


  @keyframes skeletonShimmer {
    0% {
      background-position:
        200%
        0;
    }

    100% {
      background-position:
        -200%
        0;
    }
  }


  /* ================================================================
     SMALL TECHNICAL LABEL
     ================================================================ */

  .technical-label {
    color: var(--text-muted);

    font-family: var(--font-mono);

    font-size: 8px;
    font-weight: 700;

    letter-spacing: .13em;

    text-transform: uppercase;
  }


  /* ================================================================
     STATUS DOT
     ================================================================ */

  .status-dot {
    width: 7px;
    height: 7px;

    display: inline-block;
    flex: 0 0 7px;

    border-radius: 50%;

    background: var(--accent-active);

    box-shadow:
      0 0 9px
      color-mix(
        in srgb,
        var(--accent-active) 55%,
        transparent
      );
  }


  .status-dot.warning {
    background: var(--accent-warning);

    box-shadow:
      0 0 9px
      color-mix(
        in srgb,
        var(--accent-warning) 55%,
        transparent
      );
  }


  .status-dot.critical {
    background: var(--accent-critical);

    box-shadow:
      0 0 9px
      color-mix(
        in srgb,
        var(--accent-critical) 55%,
        transparent
      );
  }


  /* ================================================================
     RESPONSIVE — TABLET
     ================================================================ */

  @media (max-width: 1200px) {

    .page {
      padding:
        24px
        24px
        40px;
    }


    .summary-cards {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

  }


  /* ================================================================
     RESPONSIVE — MOBILE / TABLET
     ================================================================ */

  @media (max-width: 860px) {

    .page {
      padding:
        22px
        18px
        36px;
    }


    .page-header {
      align-items: flex-start;

      flex-direction: column;
    }


    .page-header-actions {
      width: 100%;
    }


    /*
     * IMPORTANT:
     * Keep summary/KPI cards in two columns on mobile.
     * Previously this became one column at smaller widths.
     */

    .summary-cards {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 10px;
    }


    .summary-card {
      padding:
        15px
        14px;
    }


    .panel {
      padding: 17px;
    }


    .data-table,
    .km-table {
      min-width: 620px;
    }


    .panel:has(
      .data-table,
      .km-table
    ) {
      overflow-x: auto;
    }

  }


  /* ================================================================
     RESPONSIVE — PHONE
     ================================================================ */

  @media (max-width: 560px) {

    .page {
      padding:
        18px
        14px
        30px;

      gap: 16px;
    }


    .page-header h1 {
      font-size: 21px;
    }


    .page-header h1::before {
      width: 18px;
      margin-right: 8px;
    }


    /*
     * KEEP KPIs SIDE-BY-SIDE ON PHONE
     *
     * 4 cards become:
     *
     * ┌──────────┐ ┌──────────┐
     * │   KPI 1  │ │   KPI 2  │
     * └──────────┘ └──────────┘
     *
     * ┌──────────┐ ┌──────────┐
     * │   KPI 3  │ │   KPI 4  │
     * └──────────┘ └──────────┘
     */

    .summary-cards {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 9px;

      width: 100%;
    }


    .summary-card {
      width: 100%;
      min-width: 0;

      padding:
        13px
        11px;

      border-radius: 11px;

      gap: 6px;
    }


    .card-label {
      font-size: 7.5px;
      letter-spacing: .09em;

      /*
       * Prevent long labels from making
       * one card wider than the other.
       */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }


    .card-value {
      font-size: 21px;
      line-height: 1.05;

      /*
       * Prevent large values from breaking
       * the two-column mobile layout.
       */
      white-space: nowrap;
    }


    .unit {
      font-size: 10px;
      margin-left: 2px;
    }


    .panel {
      border-radius: 11px;
      padding: 15px;
    }


    .panel-header {
      gap: 8px;
    }


    .panel-header h2 {
      font-size: 13px;
    }


    .date-nav,
    .filters {
      width: 100%;
    }


    .date-nav input[type='date'],
    .date-input {
      flex: 1;
      min-width: 0;
    }


    .page-header-actions {
      gap: 7px;
    }


    .page-header-actions > * {
      max-width: 100%;
    }

  }


  /* ================================================================
     VERY SMALL PHONES
     ================================================================ */

  @media (max-width: 380px) {

    .page {
      padding:
        15px
        10px
        26px;

      gap: 14px;
    }


    .summary-cards {
      gap: 7px;
    }


    .summary-card {
      padding:
        12px
        9px;

      border-radius: 9px;
    }


    .card-label {
      font-size: 7px;
    }


    .card-value {
      font-size: 18px;
    }


    .unit {
      font-size: 9px;
    }

  }


  /* ================================================================
     REDUCED MOTION
     ================================================================ */

  @media (prefers-reduced-motion: reduce) {

    .page,
    .summary-card,
    .panel,
    .km-table tr,
    .data-table tr {

      animation: none;

    }


    .skeleton-row {

      animation: none;

      opacity: .6;

    }

  }

  /* ================================================================
     ENOVA ROBOTICS — GLOBAL LIGHT MODE
     Applies to ALL feature pages:
     Missions
     Anomalies
     Kilometrage
     Inspection
     Teleoperation
     Docking
     ================================================================ */

  body.light {
    --page-bg: #f7f9fc;

    --panel-base: #ffffff;
    --panel-raised: #ffffff;

    --border-subtle: #dfe7f1;

    --text-primary: #17263d;
    --text-secondary: #52647c;
    --text-muted: #8291a6;

    --accent-primary: #2f78d4;
    --accent-active: #2877d2;

    --accent-warning: #e4a21a;
    --accent-critical: #e5484d;

    --shadow-card:
      0 2px 10px rgba(24, 55, 92, .055);

    --shadow-card-hover:
      0 8px 24px rgba(24, 55, 92, .10);
  }


  /* ================================================================
     LIGHT MODE — PAGE
     ================================================================ */

  body.light .page {
    background: #f7f9fc;
    color: #17263d;
  }


  /* ================================================================
     LIGHT MODE — HEADERS
     ================================================================ */

  body.light .page-header h1 {
    color: #17263d;
  }

  body.light .page-header h1::before {
    background: #2f78d4;

    box-shadow:
      0 0 10px
      rgba(47, 120, 212, .20);
  }

  body.light .page-sub {
    color: #8291a6;
  }


  /* ================================================================
     LIGHT MODE — KPI / SUMMARY GRID
     ================================================================ */

  body.light .summary-cards {
    display: grid;

    grid-template-columns:
      repeat(3, minmax(0, 1fr));

    column-gap: 22px;
    row-gap: 18px;
  }


  /* ================================================================
     LIGHT MODE — KPI CARD
     ================================================================ */

  body.light .summary-card {
    background: #ffffff;

    border:
      1px solid
      #dfe7f1;

    border-radius: 15px;

    box-shadow:
      0 2px 10px
      rgba(24, 55, 92, .055);
  }

  body.light .summary-card::before {
    background: #2f78d4;
  }

  body.light .summary-card::after {
    background:
      rgba(47, 120, 212, .035);
  }

  body.light .summary-card:hover {
    border-color: #b9cee8;

    box-shadow:
      0 8px 24px
      rgba(24, 55, 92, .10);
  }

  body.light .card-label {
    color: #52647c;
  }

  body.light .card-value {
    color: #17263d;
  }

  body.light .unit {
    color: #8291a6;
  }


  /* ================================================================
     LIGHT MODE — PANELS
     ================================================================ */

  body.light .panel {
    background: #ffffff;

    border:
      1px solid
      #dfe7f1;

    border-radius: 15px;

    box-shadow:
      0 2px 10px
      rgba(24, 55, 92, .055);
  }

  body.light .panel:hover {
    border-color: #c6d8ed;

    box-shadow:
      0 8px 24px
      rgba(24, 55, 92, .09);
  }

  body.light .panel::before {
    background: #2f78d4;
  }

  body.light .panel-header h2 {
    color: #17263d;
  }

  body.light .panel-header h2::before {
    background: #2f78d4;

    box-shadow:
      0 0 8px
      rgba(47, 120, 212, .30);
  }


  /* ================================================================
     LIGHT MODE — TABLES
     ================================================================ */

  body.light .km-table,
  body.light .data-table {
    color: #52647c;
  }

  body.light .km-table th,
  body.light .data-table th {
    color: #8291a6;

    border-bottom:
      1px solid
      #dfe7f1;
  }

  body.light .km-table td,
  body.light .data-table td {
    color: #52647c;

    border-bottom:
      1px solid
      #e8edf4;
  }

  body.light .km-table tbody tr:hover,
  body.light .data-table tbody tr:hover {
    background:
      rgba(47, 120, 212, .035);
  }

  body.light .km-table tr:last-child td,
  body.light .data-table tr:last-child td {
    border-bottom: none;
  }

  body.light .bold {
    color: #17263d !important;
  }


  /* ================================================================
     LIGHT MODE — DATE / FILTER CONTROLS
     ================================================================ */

  body.light .date-nav button,
  body.light .nav-btn,
  body.light .date-nav input[type='date'],
  body.light .date-input,
  body.light select {
    color: #52647c;

    background: #ffffff;

    border:
      1px solid
      #dfe7f1;

    box-shadow:
      0 1px 3px
      rgba(24, 55, 92, .025);
  }

  body.light .date-nav button:hover,
  body.light .nav-btn:hover {
    color: #2877d2;

    background: #f7faff;

    border-color: #b9cee8;

    box-shadow:
      0 5px 18px
      rgba(47, 120, 212, .08);
  }

  body.light .date-nav input[type='date']:hover,
  body.light .date-input:hover,
  body.light select:hover {
    border-color: #b9cee8;
  }

  body.light .date-nav input[type='date']:focus,
  body.light .date-input:focus,
  body.light select:focus {
    border-color: #2f78d4;

    box-shadow:
      0 0 0 3px
      rgba(47, 120, 212, .10);
  }


  /* ================================================================
     LIGHT MODE — BUTTONS
     ================================================================ */

  body.light .btn-secondary {
    color: #52647c;

    background: #ffffff;

    border:
      1px solid
      #dfe7f1;
  }

  body.light .btn-secondary:hover {
    color: #2877d2;

    background: #f7faff;

    border-color: #b9cee8;
  }

  body.light .btn-primary {
    color: #ffffff;

    background: #2f78d4;

    border-color: #2f78d4;

    box-shadow:
      0 4px 12px
      rgba(47, 120, 212, .16);
  }

  body.light .btn-primary:hover {
    box-shadow:
      0 7px 20px
      rgba(47, 120, 212, .22);
  }


  /* ================================================================
     LIGHT MODE — STATUS / TYPE PILLS
     ================================================================ */

  body.light .delay-pill,
  body.light .type-pill,
  body.light .cat-pill,
  body.light .criticite-badge,
  body.light .statut-badge,
  body.light .type-badge {
    background: #f3f7fc;
    border-color: #dfe7f1;
    color: #52647c;
  }

  body.light .delay-pill {
    color: #2877d2;

    background:
      rgba(47, 120, 212, .08);

    border-color:
      rgba(47, 120, 212, .15);
  }

  body.light .delay-pill.is-late {
    color: #e5484d;

    background:
      rgba(229, 72, 77, .08);

    border-color:
      rgba(229, 72, 77, .15);
  }


  /* ================================================================
     LIGHT MODE — STATUS DOTS
     ================================================================ */

  body.light .status-dot {
    background: #2f78d4;

    box-shadow:
      0 0 9px
      rgba(47, 120, 212, .30);
  }

  body.light .status-dot.warning {
    background: #e4a21a;

    box-shadow:
      0 0 9px
      rgba(228, 162, 26, .30);
  }

  body.light .status-dot.critical {
    background: #e5484d;

    box-shadow:
      0 0 9px
      rgba(229, 72, 77, .30);
  }


  /* ================================================================
     LIGHT MODE — EMPTY STATES
     ================================================================ */

  body.light .empty {
    color: #8291a6;

    background:
      #f8fafc;

    border:
      1px dashed
      #dfe7f1;
  }

  body.light .empty strong {
    color: #52647c;
  }


  /* ================================================================
     LIGHT MODE — LOADING
     ================================================================ */

  body.light .skeleton-row {
    border-color: #dfe7f1;

    background:
      linear-gradient(
        90deg,
        #f1f5f9 20%,
        #e8f0fa 50%,
        #f1f5f9 80%
      );

    background-size:
      200%
      100%;
  }


  /* ================================================================
     LIGHT MODE — TECHNICAL TEXT
     ================================================================ */

  body.light .technical-label {
    color: #8291a6;
  }

  body.light .mono {
    color: inherit;
  }

  body.light .muted {
    color: #8291a6;
  }


  /* ================================================================
     LIGHT MODE — ROW STATES
     ================================================================ */

  body.light .row-late {
    background:
      rgba(229, 72, 77, .045);
  }

  body.light .row-late:hover {
    background:
      rgba(229, 72, 77, .075) !important;
  }


  /* ================================================================
     RESPONSIVE — LIGHT MODE KPI GRID
     ================================================================ */

  @media (max-width: 1200px) {

    body.light .summary-cards {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));

      column-gap: 18px;
      row-gap: 16px;
    }

  }


  @media (max-width: 860px) {

    body.light .summary-cards {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      column-gap: 16px;
      row-gap: 16px;
    }

  }


  @media (max-width: 560px) {

    body.light .summary-cards {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      column-gap: 10px;
      row-gap: 10px;
    }

    body.light .summary-card {
      min-height: 118px;

      padding:
        13px
        12px;
    }

    body.light .card-label {
      font-size: 9.5px;
    }

    body.light .card-value {
      font-size: 21px;
    }

  }`;