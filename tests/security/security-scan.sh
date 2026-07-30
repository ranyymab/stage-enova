#!/usr/bin/env bash
#
# security-scan.sh — vérifications de sécurité "boîte noire" contre un
# backend PGuard Monitor démarré (dev/test uniquement, jamais en prod sans
# autorisation : ce script provoque volontairement des échecs de connexion
# et peut verrouiller des comptes de test).
#
# Usage: ./security-scan.sh [base_url]
#   base_url par défaut : http://localhost:8081

set -uo pipefail

BASE_URL="${1:-http://localhost:8081}"
PASS=0
FAIL=0

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }

check() {
  local description="$1"
  local ok="$2"
  if [ "$ok" = "true" ]; then
    green "[PASS] $description"
    PASS=$((PASS + 1))
  else
    red "[FAIL] $description"
    FAIL=$((FAIL + 1))
  fi
}

echo "== Test de sécurité contre $BASE_URL =="
echo

# ---------------------------------------------------------------
# 1. En-têtes de sécurité HTTP
# ---------------------------------------------------------------
echo "-- En-têtes de sécurité --"
HEADERS=$(curl -s -D - -o /dev/null -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"wrong"}')

for header in "Strict-Transport-Security" "X-Content-Type-Options" "Content-Security-Policy" "Referrer-Policy"; do
  if echo "$HEADERS" | grep -qi "^$header:"; then
    check "En-tête présent : $header" "true"
  else
    check "En-tête présent : $header" "false"
  fi
done
echo

# ---------------------------------------------------------------
# 2. Endpoints protégés sans jeton
# ---------------------------------------------------------------
echo "-- Accès non authentifié --"
ME_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/auth/me")
[ "$ME_STATUS" = "401" ] && check "/api/auth/me sans jeton -> 401" "true" || check "/api/auth/me sans jeton -> 401 (obtenu: $ME_STATUS)" "false"

ME_BAD_TOKEN=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api/auth/me" -H "Authorization: Bearer invalid.token.value")
[ "$ME_BAD_TOKEN" = "401" ] && check "/api/auth/me avec jeton invalide -> 401" "true" || check "/api/auth/me avec jeton invalide -> 401 (obtenu: $ME_BAD_TOKEN)" "false"
echo

# ---------------------------------------------------------------
# 3. Rate limiting sur /api/auth/login
# ---------------------------------------------------------------
echo "-- Rate limiting (peut prendre quelques secondes) --"
GOT_429="false"
for i in $(seq 1 20); do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"ratelimit-test@example.com","password":"wrong"}')
  if [ "$STATUS" = "429" ]; then
    GOT_429="true"
    break
  fi
done
check "Le serveur renvoie 429 après trop de requêtes de connexion" "$GOT_429"
echo

# ---------------------------------------------------------------
# 4. Anti-énumération de comptes
# ---------------------------------------------------------------
echo "-- Anti-énumération de comptes --"
RESEND_EXISTING=$(curl -s -X POST "$BASE_URL/api/auth/resend-code" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pguard.local"}')
RESEND_UNKNOWN=$(curl -s -X POST "$BASE_URL/api/auth/resend-code" \
  -H "Content-Type: application/json" \
  -d '{"email":"this-email-does-not-exist-xyz@example.com"}')

if [ "$RESEND_EXISTING" = "$RESEND_UNKNOWN" ]; then
  check "/api/auth/resend-code renvoie le même message pour un e-mail existant ou non" "true"
else
  check "/api/auth/resend-code renvoie le même message pour un e-mail existant ou non" "false"
fi
echo

# ---------------------------------------------------------------
# 5. Résistance aux injections basiques
# ---------------------------------------------------------------
echo "-- Injection basique (SQLi / XSS) --"
INJECTION_STATUS=$(curl -s -o /tmp/security_scan_injection_body.json -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"'"' OR '"'"'1'"'"'='"'"'1","password":"<script>alert(1)</script>"}')

if [ "$INJECTION_STATUS" != "500" ]; then
  check "Payload d'injection ne provoque pas d'erreur 500 (obtenu: $INJECTION_STATUS)" "true"
else
  check "Payload d'injection ne provoque pas d'erreur 500 (obtenu: $INJECTION_STATUS)" "false"
fi

if grep -q "<script>" /tmp/security_scan_injection_body.json 2>/dev/null; then
  check "La réponse ne réfléchit pas le payload XSS tel quel" "false"
else
  check "La réponse ne réfléchit pas le payload XSS tel quel" "true"
fi
rm -f /tmp/security_scan_injection_body.json
echo

# ---------------------------------------------------------------
# Résumé
# ---------------------------------------------------------------
echo "== Résumé : $PASS réussite(s), $FAIL échec(s) =="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
