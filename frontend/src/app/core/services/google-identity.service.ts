import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AUTH_CONFIG } from '../config/app-config';

declare const google: any;

/**
 * Intègre le bouton "Se connecter avec Google" (Google Identity Services).
 * Le SDK est chargé via <script src="https://accounts.google.com/gsi/client">
 * dans index.html. Ce service se contente d'initialiser le SDK avec notre
 * Client ID et de dessiner le bouton ; la vérification réelle du jeton se
 * fait côté backend (GoogleTokenService) — on ne fait JAMAIS confiance à ce
 * jeton côté client.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly platformId = inject(PLATFORM_ID);
  private initialized = false;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  isConfigured(): boolean {
    return !AUTH_CONFIG.GOOGLE_CLIENT_ID.startsWith('REPLACE_WITH_');
  }

  /**
   * Dessine le bouton officiel Google dans l'élément fourni.
   * `onCredential` reçoit le ID token JWT signé par Google à transmettre
   * tel quel au backend (POST /api/auth/google).
   */
  renderButton(container: HTMLElement, onCredential: (idToken: string) => void): void {
    if (!this.isBrowser || !this.isConfigured()) {
      return;
    }

    this.waitForSdk(() => {
      if (!this.initialized) {
        google.accounts.id.initialize({
          client_id: AUTH_CONFIG.GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => onCredential(response.credential),
          ux_mode: 'popup',
        });
        this.initialized = true;
      }

      google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 320,
      });
    });
  }

  private waitForSdk(callback: () => void, attemptsLeft = 20): void {
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      callback();
      return;
    }
    if (attemptsLeft <= 0) {
      return;
    }
    setTimeout(() => this.waitForSdk(callback, attemptsLeft - 1), 150);
  }
}
