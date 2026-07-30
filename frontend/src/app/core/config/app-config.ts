/**
 * Configuration d'authentification côté frontend.
 *
 * GOOGLE_CLIENT_ID : à remplacer par le "Client ID" OAuth 2.0 créé sur
 * https://console.cloud.google.com/apis/credentials (type "ID client OAuth" >
 * "Application Web"), avec http://localhost:4200 (dev) et votre domaine de
 * production ajoutés comme "Origines JavaScript autorisées".
 * Le MÊME Client ID doit être renseigné côté backend
 * (backend/src/main/resources/application.properties -> app.google.client-id,
 * ou la variable d'environnement GOOGLE_CLIENT_ID).
 *
 * Ceci n'est PAS un secret : le Client ID est public par nature (il apparaît
 * dans le code JS envoyé au navigateur). Le vrai secret ("Client secret")
 * n'est jamais utilisé côté frontend.
 */
export const AUTH_CONFIG = {
  API_BASE_URL: 'http://localhost:8081/api/auth',
  GOOGLE_CLIENT_ID: 'REPLACE_WITH_YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com',
};
