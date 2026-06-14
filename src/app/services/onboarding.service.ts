import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

const STORAGE_PREFIX = 'stock-saas-onboarding-dismissed';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  constructor(private authService: AuthService) {}

  isDismissed(): boolean {
    const key = this.storageKey();
    if (!key) {
      return true;
    }
    return localStorage.getItem(key) === '1';
  }

  dismiss(): void {
    const key = this.storageKey();
    if (key) {
      localStorage.setItem(key, '1');
    }
  }

  shouldShowForAdmin(): boolean {
    return this.authService.isAdminEntreprise() && !this.isDismissed();
  }

  private storageKey(): string | null {
    const user = this.authService.getCurrentUser();
    const companyId = user?.companyId;
    if (!companyId) {
      return null;
    }
    return `${STORAGE_PREFIX}-${companyId}`;
  }
}
