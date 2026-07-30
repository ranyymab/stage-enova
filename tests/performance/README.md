# Tests de performance

Utilise [k6](https://k6.io), un outil de test de charge en ligne de commande
(scripts JS, pas de dépendance ajoutée au projet lui-même).

## Installation

- macOS : `brew install k6`
- Windows : `choco install k6` ou `winget install k6`
- Linux : voir https://k6.io/docs/get-started/installation/
- Ou via Docker (aucune installation) :
  ```bash
  docker run --rm -i --network host -e BASE_URL=http://localhost:8081 \
    grafana/k6 run - < k6-load-test.js
  ```

## Avant de lancer

Le script se connecte avec un compte réel. Par défaut il utilise le compte
opérateur seedé automatiquement au démarrage du backend
(`operateur@pguard.local` / `Operateur123!`). Vous pouvez pointer vers un
autre compte de test :

```bash
k6 run -e TEST_EMAIL=vous@example.com -e TEST_PASSWORD='VotreMotDePasse1!' k6-load-test.js
```

## Lancer le test

```bash
k6 run k6-load-test.js
# ou contre un autre environnement :
k6 run -e BASE_URL=https://staging.example.com k6-load-test.js
```

## Ce que le script mesure

1. **`legitimate_logins`** — une charge progressive (jusqu'à 5 utilisateurs
   simultanés) de connexions *valides*. On s'attend à des réponses rapides et
   à un taux de succès élevé.
2. **`brute_force_attempt`** — 30 tentatives de connexion invalides par
   seconde pendant 30s, pour vérifier que le rate-limiter
   (`RateLimitFilter`, 10 requêtes/min/IP sur `/api/auth/login`) coupe
   effectivement le trafic abusif (réponses `429`).

## Interpréter les résultats

- `http_req_duration{scenario:legitimate_logins} p(95)` doit rester sous
  800ms : si ce n'est pas le cas, le login (BCrypt + génération JWT) est
  probablement un goulot d'étranglement à investiguer (ex: coût BCrypt trop
  élevé pour le volume attendu, base de données lente).
- `legitimate_login_success` doit rester > 95% : un taux plus bas indique
  que le rate-limiter est probablement trop agressif pour un usage normal
  (seuils à revoir dans `RateLimitFilter`), ou que le serveur est saturé.
- Des `429` sur le scénario `brute_force_attempt` sont un **succès** (preuve
  que la protection anti brute-force fonctionne), pas un signe de problème de
  performance.

## Aller plus loin

Pour un test de charge plus large (pages du dashboard, WebSocket télémétrie,
etc.), dupliquez ce script en ajoutant de nouveaux scénarios `exec` qui
ciblent les autres endpoints de l'API (`/api/missions`, `/api/anomalies`,
etc.), avec un jeton JWT valide obtenu via `/api/auth/login` au setup du test
(`export function setup() { ... }` dans k6).
