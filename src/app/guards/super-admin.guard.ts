import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

/**
 * Guard pour vérifier si l'utilisateur est authentifié ET super admin
 * Redirige vers la page de connexion si l'utilisateur n'est pas connecté
 * Redirige vers le dashboard si l'utilisateur n'est pas super admin
 */
export const superAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // D'abord vérifier si l'utilisateur est authentifié
  if (!authService.isAuthenticated()) {
    // Rediriger vers la page de connexion avec l'URL de retour
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  // Ensuite vérifier si l'utilisateur est super admin
  if (authService.isSuperAdmin()) {
    return true;
  }

  // Rediriger vers le dashboard approprié selon le rôle de l'utilisateur
  const user = authService.getCurrentUser();
  if (user?.role === 'ADMIN_ENTREPRISE') {
    router.navigate(['/company-admin/dashboard']);
  } else if (user?.role === 'GESTIONNAIRE') {
    router.navigate(['/gestionnaire/dashboard']);
  } else {
    router.navigate(['/login']);
  }
  return false;
};

