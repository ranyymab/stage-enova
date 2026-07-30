# Tests de sécurité

## 1. `security-scan.sh` — script maison (à lancer en premier)

Vérifie, en conditions réelles contre un backend démarré, les protections
mises en place dans ce projet :

- **En-têtes de sécurité HTTP** présents (`Strict-Transport-Security`,
  `X-Content-Type-Options`, `X-Frame-Options`/CSP `frame-ancestors`,
  `Content-Security-Policy`).
- **Rate limiting** sur `/api/auth/login` : après le seuil configuré
  (10 requêtes/minute par défaut), le serveur doit répondre `429`.
- **Verrouillage de compte** après 5 échecs de mot de passe consécutifs
  (le 6e essai, même avec le bon mot de passe, doit être refusé le temps du
  verrouillage).
- **Anti-énumération de comptes** : `/api/auth/register` et
  `/api/auth/resend-code` ne doivent pas révéler si un e-mail existe déjà
  via des messages différents.
- **Injection basique** : un payload de type `' OR '1'='1` ou `<script>`
  dans les champs email/mot de passe ne doit jamais provoquer une erreur 500
  ni être reflété tel quel dans la réponse.
- **Endpoints protégés** : `/api/auth/me` (et les routes métier) doivent
  répondre `401` sans jeton, et rejeter un jeton invalide/expiré.

### Lancer le script

```bash
chmod +x security-scan.sh
./security-scan.sh http://localhost:8081
```

Le script affiche `[PASS]` / `[FAIL]` pour chaque vérification et se termine
avec un code de sortie non-nul si une vérification échoue (utilisable dans une
CI).

## 2. Analyse approfondie avec OWASP ZAP (optionnel, recommandé avant mise en prod)

Le script ci-dessus couvre les points spécifiques à ce projet. Pour une
analyse plus large (en-têtes, cookies, fuites d'information, vulnérabilités
connues des librairies exposées, etc.), utilisez le scanner
[OWASP ZAP](https://www.zaproxy.org/) en mode "baseline" :

```bash
docker run --rm -t \
  --network host \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://localhost:8081 -r zap-report.html
```

Le rapport HTML généré liste les vulnérabilités par niveau de gravité. Traitez
en priorité tout ce qui est classé "High"/"Medium" avant une mise en
production.

## 3. Dépendances vulnérables

Vérifiez régulièrement les dépendances (backend et frontend) avec les outils
déjà intégrés à l'écosystème, sans dépendance supplémentaire à installer :

```bash
# Backend (Maven) — liste les CVE connues des dépendances
cd backend && mvn org.owasp:dependency-check-maven:check

# Frontend (npm)
cd frontend && npm audit
```

## Limites connues à garder en tête

- Le rate-limiter (`RateLimitFilter`) est en mémoire locale : il protège une
  seule instance. En cas de déploiement multi-instances derrière un
  load-balancer, remplacez-le par un compteur partagé (ex: Redis) pour
  garder une protection efficace.
- Le verrouillage de compte est basé sur l'e-mail, pas sur l'IP : un
  attaquant ne peut pas contourner le verrouillage en changeant d'IP, mais un
  attaquant qui connaît beaucoup d'e-mails pourrait tenter un mot de passe
  "populaire" sur chacun (attaque "password spraying"). Une détection
  supplémentaire par IP peut être ajoutée si besoin.
