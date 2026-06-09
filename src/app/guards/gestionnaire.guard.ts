import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour vérifier si l'utilisateur est authentifié ET gestionnaire
 * Redirige vers la page de connexion si l'utilisateur n'est pas connecté
 * Redirige vers le dashboard approprié si l'utilisateur n'a pas le bon rôle
 */
export const gestionnaireGuard: CanActivateFn = (route, state) => {
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

  // Vérifier si l'utilisateur est gestionnaire ou a un rôle supérieur
  if (authService.isGestionnaire() || authService.isAdminEntreprise() || authService.isSuperAdmin()) {
    return true;
  }

  // Rediriger vers le dashboard approprié selon le rôle de l'utilisateur
  const user = authService.getCurrentUser();
  if (user?.role === 'ADMIN_ENTREPRISE') {
    router.navigate(['/company-admin/dashboard']);
  } else if (user?.role === 'SUPER_ADMIN') {
    router.navigate(['/super-admin/dashboard']);
  } else {
    router.navigate(['/login']);
  }
  return false;
};
