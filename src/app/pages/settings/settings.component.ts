import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessageService } from 'primeng/api';
import { PhoneFormatDirective } from '../../directives/phone-format.directive';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { compressImageIfNeeded, MAX_IMAGE_BYTES } from '../../utils/image-compress.util';
import { catchError, finalize, of, throwError } from 'rxjs';

interface CompanySettingsResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  region: string | null;
  country: string | null;
  planCode: string | null;
  logoUrl: string | null;
  notifLowStock: boolean | null;
  notifMovements: boolean | null;
  notifReports: boolean | null;
}

interface NotificationSettings {
  lowStock: boolean;
  movements: boolean;
  reports: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    InputSwitchModule,
    PhoneFormatDirective
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  @ViewChild('logoInput') logoInput?: ElementRef<HTMLInputElement>;

  companyId: number | null = null;
  isSaving = false;
  isSavingNotifications = false;
  isUploadingLogo = false;
  isRemovingLogo = false;
  logoUrl: string | null = null;
  logoPreviewUrl: string | null = null;
  private logoObjectUrl: string | null = null;
  company = {
    name: '',
    email: '',
    phone: '',
    address: '',
    region: '',
    country: 'Sénégal'
  };

  notifications: NotificationSettings = {
    lowStock: true,
    movements: true,
    reports: false
  };

  constructor(
    private messageService: MessageService,
    private apiService: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.companyId = currentUser?.companyId ?? null;

    if (!this.companyId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Entreprise introuvable',
        detail: 'Impossible de déterminer l’entreprise associée à votre compte.',
        life: 5000
      });
      return;
    }

    this.loadCompanySettings();
  }

  private loadCompanySettings(): void {
    if (!this.companyId) return;
    this.apiService.get<CompanySettingsResponse>(`/companies/${this.companyId}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des paramètres entreprise:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les paramètres de l’entreprise.'
          });
          return of(null);
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.company = {
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          region: data.region ?? '',
          country: data.country ?? 'Sénégal'
        };
        this.notifications = {
          lowStock: data.notifLowStock ?? true,
          movements: data.notifMovements ?? true,
          reports: data.notifReports ?? false
        };
        this.logoUrl = data.logoUrl ?? null;
        this.revokeLogoPreview();
        this.logoPreviewUrl = this.logoUrl;
      });
  }

  get displayedLogoUrl(): string | null {
    return this.logoPreviewUrl;
  }

  openLogoPicker(): void {
    this.logoInput?.nativeElement.click();
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file || !this.companyId) {
      return;
    }

    if (!file.type.match(/image\/(png|jpg|jpeg|gif|webp)/)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Format non accepté',
        detail: 'Utilisez une image PNG, JPG, WebP ou GIF.',
        life: 4000
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fichier trop volumineux',
        detail: 'Le logo ne doit pas dépasser 5 Mo.',
        life: 4000
      });
      return;
    }

    compressImageIfNeeded(file, MAX_IMAGE_BYTES)
      .then((processed) => this.uploadLogo(processed))
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de traiter l\'image.',
          life: 4000
        });
      });
  }

  private uploadLogo(file: File): void {
    if (!this.companyId) {
      return;
    }

    const form = new FormData();
    form.append('image', file);
    this.isUploadingLogo = true;

    this.apiService.postFormData<CompanySettingsResponse>(`/companies/${this.companyId}/logo`, form)
      .pipe(finalize(() => {
        this.isUploadingLogo = false;
      }))
      .subscribe({
        next: (data) => {
          this.logoUrl = data.logoUrl ?? null;
          this.revokeLogoPreview();
          this.logoPreviewUrl = this.withCacheBuster(this.logoUrl);
          this.messageService.add({
            severity: 'success',
            summary: 'Logo enregistré',
            detail: 'Le logo de votre entreprise a été mis à jour.',
            life: 3500
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Impossible d\'enregistrer le logo.',
            life: 5000
          });
        }
      });
  }

  removeLogo(): void {
    if (!this.companyId || !this.logoUrl) {
      return;
    }

    this.isRemovingLogo = true;
    this.apiService.delete<CompanySettingsResponse>(`/companies/${this.companyId}/logo`)
      .pipe(finalize(() => {
        this.isRemovingLogo = false;
      }))
      .subscribe({
        next: () => {
          this.logoUrl = null;
          this.revokeLogoPreview();
          this.logoPreviewUrl = null;
          this.messageService.add({
            severity: 'info',
            summary: 'Logo supprimé',
            detail: 'Votre entreprise n\'a plus de logo.',
            life: 3500
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Impossible de supprimer le logo.',
            life: 5000
          });
        }
      });
  }

  private withCacheBuster(url: string | null): string | null {
    if (!url) {
      return null;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }

  private revokeLogoPreview(): void {
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl);
      this.logoObjectUrl = null;
    }
  }

  private buildCompanyPayload() {
    return {
      name: this.company.name.trim(),
      email: this.company.email.trim(),
      phone: this.company.phone?.trim() || null,
      address: this.company.address?.trim() || null,
      region: this.company.region?.trim() || null,
      country: this.company.country?.trim() || 'Sénégal',
      notifLowStock: this.notifications.lowStock,
      notifMovements: this.notifications.movements,
      notifReports: this.notifications.reports
    };
  }

  saveSettings() {
    if (!this.companyId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action impossible',
        detail: 'Entreprise non identifiée.'
      });
      return;
    }

    if (!this.company.name.trim() || !this.company.email.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le nom de l’entreprise et l’email sont obligatoires.'
      });
      return;
    }

    this.isSaving = true;
    const payload = this.buildCompanyPayload();

    this.apiService.put<CompanySettingsResponse>(`/companies/${this.companyId}`, payload)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la sauvegarde des paramètres entreprise:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Impossible d’enregistrer les paramètres.'
          });
          return throwError(() => error);
        }),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Paramètres enregistrés',
          detail: 'Les informations de votre entreprise ont été mises à jour.',
          life: 4000
        });
      });
  }

  saveNotifications(): void {
    if (!this.companyId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action impossible',
        detail: 'Entreprise non identifiée.'
      });
      return;
    }

    this.isSavingNotifications = true;
    this.apiService.put<CompanySettingsResponse>(`/companies/${this.companyId}`, this.buildCompanyPayload())
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la sauvegarde des notifications:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Impossible d’enregistrer vos notifications.'
          });
          return throwError(() => error);
        }),
        finalize(() => {
          this.isSavingNotifications = false;
        })
      )
      .subscribe((data) => {
        this.notifications = {
          lowStock: data.notifLowStock ?? this.notifications.lowStock,
          movements: data.notifMovements ?? this.notifications.movements,
          reports: data.notifReports ?? this.notifications.reports
        };
        this.messageService.add({
          severity: 'success',
          summary: 'Notifications enregistrées',
          detail: 'Vos préférences de notifications ont été sauvegardées.',
          life: 3500
        });
      });
  }
}

