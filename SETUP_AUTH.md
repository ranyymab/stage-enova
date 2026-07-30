# Authentification — inscription, e-mail, Google Sign-In, sécurité

Ce document explique ce qui a été ajouté et **ce que vous devez configurer
vous-même** (identifiants Google, compte SMTP) pour que tout fonctionne
réellement — Claude ne peut pas créer ces identifiants à votre place car ils
appartiennent à votre compte Google / votre boîte mail.

## Ce qui a été ajouté

- **Inscription** (`/signup`) : email + nom + mot de passe (politique de mot
  de passe forte imposée).
- **Vérification d'e-mail réelle** (`/verify-email`) : à l'inscription, un
  code à 6 chiffres est envoyé par e-mail (via un vrai serveur SMTP) et doit
  être saisi pour activer le compte. Le code expire au bout de 10 minutes,
  autorise 5 essais max, et son renvoi est limité à 1 fois par minute.
- **Connexion avec Google** (bouton "Continuer avec Google" sur `/login` et
  `/signup`) : utilise Google Identity Services. Le jeton renvoyé par Google
  est **vérifié côté serveur** (signature, émetteur, audience) avant de faire
  confiance à l'e-mail transmis.
- **Sécurité renforcée** :
  - Verrouillage de compte après 5 échecs de connexion (15 minutes).
  - Limiteur de débit (rate limiting) sur toutes les routes d'authentification.
  - En-têtes de sécurité HTTP (HSTS, CSP, anti-clickjacking, Referrer-Policy).
  - BCrypt avec un facteur de coût plus élevé (12).
  - Secrets (JWT, mots de passe SMTP/BDD, Client ID Google) sortis du code et
    lus depuis des variables d'environnement (voir `.env.example`).
  - Messages d'erreur anti-énumération de comptes.
- **Dossier `tests/`** : tests de sécurité (`tests/security/`) et de
  performance (`tests/performance/`) en plus des tests unitaires Java
  classiques ajoutés dans `backend/src/test/...`.

## Ce que VOUS devez configurer

### 1. Un compte SMTP pour l'envoi des e-mails

Le plus simple pour démarrer : un compte Gmail avec un "mot de passe
d'application" (ne fonctionne qu'avec la validation en 2 étapes activée) :

1. Activez la validation en 2 étapes : https://myaccount.google.com/security
2. Créez un mot de passe d'application : https://myaccount.google.com/apppasswords
3. Copiez `.env.example` vers `.env` à la racine du projet et renseignez :
   ```
   SMTP_USERNAME=votre-adresse@gmail.com
   SMTP_PASSWORD=le_mot_de_passe_dapplication_genere
   ```

En production, préférez un service transactionnel dédié (SendGrid, Mailgun,
Amazon SES...) : plus fiable et pensé pour l'envoi en volume. Il suffit de
changer `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` dans `.env`.

**Sans SMTP configuré**, l'inscription fonctionne quand même en local : le
code de vérification est affiché dans les logs du serveur backend (grâce à
`MAIL_LOG_CODE_FALLBACK=true`, activé par défaut en dev). Pensez à mettre
cette variable à `false` avant toute mise en production.

### 2. Un Client ID Google OAuth pour "Se connecter avec Google"

1. Rendez-vous sur https://console.cloud.google.com/apis/credentials
2. Créez un projet (ou choisissez-en un existant).
3. "Créer des identifiants" > "ID client OAuth" > Type d'application :
   "Application Web".
4. Sous "Origines JavaScript autorisées", ajoutez :
   - `http://localhost:4200` (développement)
   - votre domaine de production (ex: `https://app.enovarobotics.eu`)
5. Copiez le "ID client" généré (il ressemble à
   `123456789-abc.apps.googleusercontent.com`).
6. Renseignez-le à DEUX endroits :
   - Backend : variable d'environnement `GOOGLE_CLIENT_ID` dans `.env`.
   - Frontend : `frontend/src/app/core/config/app-config.ts`, remplacez la
     valeur de `GOOGLE_CLIENT_ID`.

Tant que `GOOGLE_CLIENT_ID` n'est pas configuré, le bouton Google ne s'affiche
simplement pas (aucune erreur) et l'inscription/connexion classique reste
pleinement fonctionnelle.

### 3. Le secret JWT (obligatoire avant toute mise en production)

Une valeur par défaut est fournie pour le développement, mais elle est
**publique** (elle est dans ce dépôt) et ne doit jamais servir en production.
Générez une vraie valeur secrète :

```bash
openssl rand -base64 48
```

Mettez le résultat dans `.env` :
```
JWT_SECRET=<valeur générée>
```

### 4. Lancer le projet avec la configuration

```bash
cp .env.example .env
# ... éditez .env avec vos vraies valeurs ...
docker-compose up --build
```

`docker-compose.yml` lit automatiquement `.env` grâce à la syntaxe
`${VARIABLE:-valeur_par_defaut}`.

## Vérifier que tout fonctionne

1. Ouvrez `http://localhost:4200/signup`, créez un compte.
2. Vérifiez votre boîte mail (ou les logs du backend si SMTP non configuré)
   pour le code à 6 chiffres, saisissez-le sur `/verify-email`.
3. Vous devriez être connecté automatiquement et redirigé vers le dashboard.
4. Si le bouton Google est configuré, testez aussi "Continuer avec Google".
5. Lancez les tests de sécurité et de performance décrits dans
   [`tests/README.md`](tests/README.md).
