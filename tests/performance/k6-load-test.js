/**
 * k6-load-test.js — test de charge de l'API d'authentification PGuard Monitor.
 *
 * Installation de k6 : https://k6.io/docs/get-started/installation/
 * Exécution :
 *   k6 run k6-load-test.js
 *   k6 run -e BASE_URL=http://localhost:8081 k6-load-test.js
 *
 * Ce script simule :
 *  1. Une charge de connexions (login) avec un compte valide pré-existant.
 *  2. Une charge de tentatives invalides pour vérifier que le rate-limiter
 *     tient (on s'attend à voir apparaître des 429 passé le seuil, ce qui
 *     est un SUCCÈS du point de vue sécurité, pas un échec de charge).
 *
 * Seuils (thresholds) : le test échoue si l'API légitime (login valide)
 * devient trop lente ou trop d'erreurs surviennent en dehors du rate-limiting
 * volontaire.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';

// Compte de test valide et déjà vérifié — à créer manuellement avant de
// lancer ce script (ou utiliser un compte seedé, ex: operateur@pguard.local).
const TEST_EMAIL = __ENV.TEST_EMAIL || 'operateur@pguard.local';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'Operateur123!';

export const options = {
  scenarios: {
    // Charge "normale" : logins valides, doit rester rapide et fiable.
    legitimate_logins: {
      executor: 'ramping-vus',
      exec: 'legitimateLogin',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 5 },
        { duration: '40s', target: 5 },
        { duration: '10s', target: 0 },
      ],
    },
    // Charge "abusive" : tentatives invalides, pour vérifier que le
    // rate-limiter coupe court (429 attendu, pas un bug).
    brute_force_attempt: {
      executor: 'constant-arrival-rate',
      exec: 'bruteForceAttempt',
      rate: 30,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 20,
      maxVUs: 50,
    },
  },
  thresholds: {
    // Sur les logins légitimes uniquement :
    'http_req_duration{scenario:legitimate_logins}': ['p(95)<800'],
    'legitimate_login_success': ['rate>0.95'],
  },
};

const legitimateLoginSuccess = new Rate('legitimate_login_success');
const legitimateLoginDuration = new Trend('legitimate_login_duration');

export function legitimateLogin() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  legitimateLoginDuration.add(res.timings.duration);

  const ok = check(res, {
    'login valide -> 200 ou 429 (rate-limit acceptable sous forte charge)': (r) =>
      r.status === 200 || r.status === 429,
  });
  legitimateLoginSuccess.add(res.status === 200);

  if (!ok) {
    console.error(`Réponse inattendue: ${res.status} ${res.body}`);
  }

  sleep(1);
}

export function bruteForceAttempt() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'attacker-simulation@example.com', password: 'guess123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'tentative abusive finit par être bloquée (401 ou 429)': (r) => r.status === 401 || r.status === 429,
  });
}
