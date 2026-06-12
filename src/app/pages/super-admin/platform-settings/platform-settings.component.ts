import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, finalize, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { PlatformStatusService } from '../../../services/platform-status.service';
import { compressImageIfNeeded, MAX_IMAGE_BYTES } from '../../../utils/image-compress.util';

interface PlatformSettings {
  subscriptionMonthlyPriceFcfa: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
  hasWaveQr?: boolean;
  hasOrangeMoneyQr?: boolean;
}

type PaymentQrProvider = 'WAVE' | 'ORANGE_MONEY';

const ACCEPTED_QR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_QR_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ToggleButtonModule,
    DividerModule,
    InputNumberModule,
    InputTextarea,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './platform-settings.component.html',
  styleUrl: './platform-settings.component.scss'
})
export class PlatformSettingsComponent implements OnInit, OnDestroy {
  @ViewChild('waveQrInput') waveQrInput?: ElementRef<HTMLInputElement>;
  @ViewChild('orangeQrInput') orangeQrInput?: ElementRef<HTMLInputElement>;

  saving = false;
  uploadingQr: PaymentQrProvider | null = null;
  waveQrPreviewUrl: string | null = null;
  orangeMoneyQrPreviewUrl: string | null = null;

  platformSettings: PlatformSettings = {
    subscriptionMonthlyPriceFcfa: 5000,
    maintenanceMode: false,
    maintenanceMessage: '',
    allowNewRegistrations: true,
    hasWaveQr: false,
    hasOrangeMoneyQr: false
  };

  constructor(
    private apiService: ApiService,
    private platformStatusService: PlatformStatusService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.revokeQrPreview('WAVE');
    this.revokeQrPreview('ORANGE_MONEY');
  }

  loadSettings(): void {
    this.apiService.get<PlatformSettings>('/platform-settings')
      .pipe(
        catchError(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Impossible de charger les paramètres'
          });
          return of(null);
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.platformSettings = {
          subscriptionMonthlyPriceFcfa: data.subscriptionMonthlyPriceFcfa ?? 5000,
          maintenanceMode: !!data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage ?? '',
          allowNewRegistrations: data.allowNewRegistrations !== false,
          hasWaveQr: !!data.hasWaveQr,
          hasOrangeMoneyQr: !!data.hasOrangeMoneyQr
        };
        this.loadQrPreviews();
      });
  }

  openQrPicker(provider: PaymentQrProvider): void {
    if (provider === 'WAVE') {
      this.waveQrInput?.nativeElement.click();
    } else {
      this.orangeQrInput?.nativeElement.click();
    }
  }

  onQrInputChange(provider: PaymentQrProvider, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (file) {
      this.prepareAndUploadPaymentQr(provider, file);
    }
  }

  private prepareAndUploadPaymentQr(provider: PaymentQrProvider, file: File): void {
    if (!ACCEPTED_QR_TYPES.includes(file.type.toLowerCase())) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Format non accepté',
        detail: 'Utilisez une image JPEG, PNG ou WebP.'
      });
      return;
    }
    if (file.size > MAX_QR_BYTES) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fichier trop volumineux',
        detail: 'L\'image ne doit pas dépasser 5 Mo.'
      });
      return;
    }

    this.uploadingQr = provider;
    compressImageIfNeeded(file, MAX_IMAGE_BYTES)
      .then((processed) => {
        if (processed.size < file.size) {
          const beforeKb = Math.round(file.size / 1024);
          const afterKb = Math.round(processed.size / 1024);
          this.messageService.add({
            severity: 'info',
            summary: 'Image optimisée',
            detail: `Taille réduite de ${beforeKb} Ko à ${afterKb} Ko`,
            life: 3500
          });
        }
        this.uploadPaymentQr(provider, processed);
      })
      .catch(() => {
        this.uploadingQr = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de traiter l\'image'
        });
      });
  }

  private uploadPaymentQr(provider: PaymentQrProvider, file: File): void {
    const form = new FormData();
    form.append('image', file);

    this.apiService.postFormData<PlatformSettings>(`/platform-settings/payment-qr/${provider}`, form)
      .pipe(
        catchError(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Téléversement impossible'
          });
          return of(null);
        }),
        finalize(() => {
          this.uploadingQr = null;
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.applySettings(data);
        this.loadQrPreview(provider);
        this.messageService.add({
          severity: 'success',
          summary: 'QR code enregistré',
          detail: provider === 'WAVE' ? 'QR Wave mis à jour.' : 'QR Orange Money mis à jour.',
          life: 3500
        });
      });
  }

  deletePaymentQr(provider: PaymentQrProvider): void {
    this.uploadingQr = provider;
    this.apiService.delete<PlatformSettings>(`/platform-settings/payment-qr/${provider}`)
      .pipe(
        catchError(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Suppression impossible'
          });
          return of(null);
        }),
        finalize(() => {
          this.uploadingQr = null;
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.applySettings(data);
        this.revokeQrPreview(provider);
        this.messageService.add({
          severity: 'success',
          summary: 'QR code supprimé',
          life: 3000
        });
      });
  }

  private applySettings(data: PlatformSettings): void {
    this.platformSettings = {
      subscriptionMonthlyPriceFcfa: data.subscriptionMonthlyPriceFcfa ?? this.platformSettings.subscriptionMonthlyPriceFcfa,
      maintenanceMode: !!data.maintenanceMode,
      maintenanceMessage: data.maintenanceMessage ?? '',
      allowNewRegistrations: data.allowNewRegistrations !== false,
      hasWaveQr: !!data.hasWaveQr,
      hasOrangeMoneyQr: !!data.hasOrangeMoneyQr
    };
  }

  private loadQrPreviews(): void {
    if (this.platformSettings.hasWaveQr) {
      this.loadQrPreview('WAVE');
    } else {
      this.revokeQrPreview('WAVE');
    }
    if (this.platformSettings.hasOrangeMoneyQr) {
      this.loadQrPreview('ORANGE_MONEY');
    } else {
      this.revokeQrPreview('ORANGE_MONEY');
    }
  }

  private loadQrPreview(provider: PaymentQrProvider): void {
    this.apiService.getBlob(`/platform-settings/payment-qr/${provider}`).subscribe({
      next: (blob) => {
        this.revokeQrPreview(provider);
        const url = URL.createObjectURL(blob);
        if (provider === 'WAVE') {
          this.waveQrPreviewUrl = url;
        } else {
          this.orangeMoneyQrPreviewUrl = url;
        }
      },
      error: () => {
        this.revokeQrPreview(provider);
      }
    });
  }

  private revokeQrPreview(provider: PaymentQrProvider): void {
    if (provider === 'WAVE' && this.waveQrPreviewUrl) {
      URL.revokeObjectURL(this.waveQrPreviewUrl);
      this.waveQrPreviewUrl = null;
    }
    if (provider === 'ORANGE_MONEY' && this.orangeMoneyQrPreviewUrl) {
      URL.revokeObjectURL(this.orangeMoneyQrPreviewUrl);
      this.orangeMoneyQrPreviewUrl = null;
    }
  }

  saveSettings(): void {
    const price = Number(this.platformSettings.subscriptionMonthlyPriceFcfa);
    if (!price || price <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le montant mensuel doit être supérieur à 0.'
      });
      return;
    }

    const maintenanceMessage = (this.platformSettings.maintenanceMessage || '').trim();
    if (maintenanceMessage.length > 1000) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le motif de maintenance ne peut pas dépasser 1000 caractères.'
      });
      return;
    }

    this.saving = true;
    this.apiService.put<PlatformSettings>('/platform-settings', {
      subscriptionMonthlyPriceFcfa: price,
      maintenanceMode: this.platformSettings.maintenanceMode,
      maintenanceMessage: maintenanceMessage || null,
      allowNewRegistrations: this.platformSettings.allowNewRegistrations
    })
      .pipe(
        catchError(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Enregistrement impossible'
          });
          return of(null);
        }),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.platformSettings = {
          subscriptionMonthlyPriceFcfa: data.subscriptionMonthlyPriceFcfa,
          maintenanceMode: !!data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage ?? '',
          allowNewRegistrations: data.allowNewRegistrations !== false,
          hasWaveQr: !!data.hasWaveQr,
          hasOrangeMoneyQr: !!data.hasOrangeMoneyQr
        };
        this.platformStatusService.refresh().subscribe();
        this.messageService.add({
          severity: 'success',
          summary: 'Paramètres enregistrés',
          detail: 'Le tarif mensuel et les options plateforme ont été mis à jour.',
          life: 3500
        });
      });
  }
}
