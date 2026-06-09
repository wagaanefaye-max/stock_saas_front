import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';

/**
 * Intercepteur HTTP pour gérer les erreurs d'authentification.
 * L'authentification est gérée par cookie (envoi automatique avec withCredentials).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const loadingService = inject(LoadingService);

  // Afficher l'indicateur de chargement avant la requête
  loadingService.show();

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gérer les erreurs d'authentification (401, 403)
      if (error.status === 401 || error.status === 403) {
        const url = req.url || '';
        const isAuthEndpoint =
          url.includes('/api/auth/login') ||
          url.includes('/api/auth/register') ||
          url.includes('/api/auth/verify-account') ||
          url.includes('/api/auth/forgot-password') ||
          url.includes('/api/auth/logout');

        // Ne pas déclencher de logout/redirection pour les endpoints d'auth publics
        if (!isAuthEndpoint && authService.isAuthenticated()) {
        // Vérifier si le message d'erreur indique un problème d'accès
        const errorMessage = error.error?.message || error.message || '';
        if (errorMessage.includes('Access Denied') || 
            errorMessage.includes('Unauthorized') || 
            errorMessage.includes('Forbidden') ||
            error.status === 401) {
          
          // Nettoyer les données d'authentification
          authService.logout();
          
          // Rediriger vers la page de login avec un message
          router.navigate(['/login'], {
            queryParams: {
              error: 'Votre session a expiré. Veuillez vous reconnecter.'
            }
          });
        }
        }
      }

      // Propager l'erreur pour qu'elle soit gérée par les composants
      return throwError(() => error);
    }),
    finalize(() => {
      // Masquer l'indicateur de chargement après la requête (succès ou erreur)
      loadingService.hide();
    })
  );
};
