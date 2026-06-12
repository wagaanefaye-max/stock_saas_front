import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { PlatformStatusService } from '../services/platform-status.service';

/**
 * Bloque l'accès à l'inscription si maintenance ou inscriptions fermées.
 */
export const registrationGuard: CanActivateFn = () => {
  const platformStatusService = inject(PlatformStatusService);
  const router = inject(Router);

  return platformStatusService.loadStatus().pipe(
    map((status) => {
      if (status.maintenanceMode) {
        void router.navigate(['/maintenance']);
        return false;
      }
      if (!status.allowNewRegistrations) {
        void router.navigate(['/login'], {
          queryParams: {
            error: 'Les nouvelles inscriptions sont temporairement fermées.'
          }
        });
        return false;
      }
      return true;
    })
  );
};
