import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';
import { getErrorMessage } from '../utils/error-message.util';

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/verify-account') ||
    url.includes('/api/auth/forgot-password') ||
    url.includes('/api/auth/logout')
  );
}

function isMaintenanceError(error: HttpErrorResponse): boolean {
  const body = error.error;
  if (!body || typeof body !== 'object') {
    return false;
  }
  return body.error === 'MaintenanceMode' || body.maintenanceMode === true;
}

/**
 * Intercepteur HTTP pour gérer les erreurs d'authentification et de maintenance.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const loadingService = inject(LoadingService);

  loadingService.show();

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const url = req.url || '';

      if (error.status === 503 && isMaintenanceError(error) && !authService.isSuperAdmin()) {
        authService.clearLocalSession();
        void router.navigate(['/maintenance']);
      }

      if (error.status === 401 && !isAuthEndpoint(url)) {
        authService.handleSessionExpired();
      }

      const userMessage = getErrorMessage(error);
      const apiError =
        error.error && typeof error.error === 'object'
          ? { ...error.error, message: userMessage }
          : { message: userMessage };

      return throwError(() => ({
        ...error,
        error: apiError,
        userMessage
      }));
    }),
    finalize(() => {
      loadingService.hide();
    })
  );
};
