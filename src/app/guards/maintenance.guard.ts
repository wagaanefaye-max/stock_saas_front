import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PlatformStatusService } from '../services/platform-status.service';

/**
 * Redirige vers la page maintenance si le mode est actif (sauf super administrateur).
 */
export const maintenanceGuard: CanActivateFn = () => {
  const platformStatusService = inject(PlatformStatusService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return platformStatusService.loadStatus().pipe(
    map((status) => {
      if (!status.maintenanceMode) {
        return true;
      }
      if (authService.isSuperAdmin()) {
        return true;
      }
      authService.clearLocalSession();
      void router.navigate(['/maintenance']);
      return false;
    })
  );
};
