import { Injectable, signal } from '@angular/core';

export interface AppError {
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private errors = signal<AppError[]>([]);
  errors$ = this.errors.asReadonly();

  private isLoading = signal(false);
  isLoading$ = this.isLoading.asReadonly();

  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  addError(title: string, message: string, details?: string): void {
    const error: AppError = {
      title,
      message,
      details,
      timestamp: new Date(),
    };
    this.errors.update(errors => [...errors, error]);
    setTimeout(() => this.removeError(error.timestamp), 8000);
  }

  removeError(timestamp: Date): void {
    this.errors.update(errors =>
      errors.filter(e => e.timestamp.getTime() !== timestamp.getTime())
    );
  }

  clearErrors(): void {
    this.errors.set([]);
  }

  handleHttpError(error: any, context?: string): void {
    let message = 'Une erreur est survenue';
    let details: string | undefined;

    if (error?.error?.error) {
      message = error.error.error;
    } else if (error?.status === 0) {
      message = 'Impossible de se connecter au serveur';
      details = 'Vérifiez votre connexion réseau et réessayez.';
    } else if (error?.status === 401) {
      message = 'Vous n\'êtes pas authentifié';
      details = 'Veuillez vous reconnecter.';
    } else if (error?.status === 403) {
      message = 'Accès refusé';
      details = 'Vous n\'avez pas les permissions nécessaires.';
    } else if (error?.status === 404) {
      message = 'Ressource non trouvée';
    } else if (error?.status === 500) {
      message = 'Erreur serveur';
      details = 'Le serveur a rencontré une erreur. Veuillez réessayer plus tard.';
    } else if (error?.message) {
      message = error.message;
    }

    this.addError(
      context || 'Erreur',
      message,
      details
    );
  }
}
