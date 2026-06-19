import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { APP_DIALOG_BREAKPOINTS, APP_DIALOG_STYLE_DETAIL } from '../../../utils/dialog-mobile.util';
import { compressImageIfNeeded, MAX_IMAGE_BYTES } from '../../../utils/image-compress.util';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import {
  PAYMENT_PROVIDERS,
  SubscriptionDuration,
  SubscriptionRecord,
  SubscriptionService,
  SubscriptionStatus
} from '../../../services/subscription.service';

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-company-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanySubscriptionsComponent implements OnInit, OnDestroy {
  @ViewChild('proofInput') proofInput?: ElementRef<HTMLInputElement>;

  subscribing = false;
  showHistory = false;
  status: SubscriptionStatus | null = null;
  durations: SubscriptionDuration[] = [];
  history: SubscriptionRecord[] = [];
  paymentProviders = PAYMENT_PROVIDERS;
  selectedDuration: SubscriptionDuration | null = null;
  selectedPaymentProvider = PAYMENT_PROVIDERS.find((p) => p.enabled !== false) ?? PAYMENT_PROVIDERS[0];
  proofFile: File | null = null;
  proofPreviewUrl: string | null = null;
  isDragOver = false;
  quoteTotal: number | null = null;
  paymentQrAvailability: { wave: boolean; orangeMoney: boolean } = { wave: false, orangeMoney: false };
  activePaymentQrUrl: string | null = null;
  paymentQrLoading = false;
  paymentQrError: string | null = null;
  private paymentQrCache: Partial<Record<'WAVE' | 'ORANGE_MONEY', string>> = {};
  detailDialogVisible = false;
  selectedRecord: SubscriptionRecord | null = null;
  detailProofUrl: string | null = null;
  detailProofLoading = false;
  detailProofError: string | null = null;
  readonly dialogStyleDetail = APP_DIALOG_STYLE_DETAIL;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;

  constructor(
    private subscriptionService: SubscriptionService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.revokePreview();
    this.revokeDetailProof();
    this.revokePaymentQrCache();
  }

  loadAll(): void {
    forkJoin({
      status: this.subscriptionService.getStatus(),
      durations: this.subscriptionService.getDurations(),
      history: this.subscriptionService.getHistory().pipe(catchError(() => of([]))),
      paymentQr: this.subscriptionService.getPaymentQrAvailability().pipe(catchError(() => of({ wave: false, orangeMoney: false })))
    })
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: ({ status, durations, history, paymentQr }) => {
          this.status = status;
          this.durations = durations;
          this.history = history;
          this.paymentQrAvailability = paymentQr;
          if (durations.length && !this.selectedDuration) {
            this.selectedDuration = durations.find((d) => d.code === 'MONTH_3') ?? durations[0];
          }
          this.refreshQuote();
          this.loadPaymentQrForSelectedProvider();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err?.error?.message || 'Chargement impossible'
          });
        }
      });
  }

  selectDuration(d: SubscriptionDuration): void {
    this.selectedDuration = d;
    this.refreshQuote();
    this.cdr.markForCheck();
  }

  isPaymentProviderEnabled(provider: (typeof PAYMENT_PROVIDERS)[number]): boolean {
    return provider.enabled !== false;
  }

  selectPaymentProvider(provider: (typeof PAYMENT_PROVIDERS)[number]): void {
    if (!this.isPaymentProviderEnabled(provider)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Bientôt disponible',
        detail: 'Le paiement en espèces sera activé prochainement.',
        life: 3500
      });
      return;
    }
    this.selectedPaymentProvider = provider;
    this.loadPaymentQrForSelectedProvider();
    this.cdr.markForCheck();
  }

  showPaymentQrPanel(): boolean {
    const code = this.selectedPaymentProvider.code;
    if (code === 'WAVE') {
      return this.paymentQrAvailability.wave;
    }
    if (code === 'ORANGE_MONEY') {
      return this.paymentQrAvailability.orangeMoney;
    }
    return false;
  }

  private loadPaymentQrForSelectedProvider(): void {
    this.paymentQrError = null;
    const code = this.selectedPaymentProvider.code;
    if (code !== 'WAVE' && code !== 'ORANGE_MONEY') {
      this.activePaymentQrUrl = null;
      this.cdr.markForCheck();
      return;
    }
    if (code === 'WAVE' && !this.paymentQrAvailability.wave) {
      this.activePaymentQrUrl = null;
      this.cdr.markForCheck();
      return;
    }
    if (code === 'ORANGE_MONEY' && !this.paymentQrAvailability.orangeMoney) {
      this.activePaymentQrUrl = null;
      this.cdr.markForCheck();
      return;
    }

    const cached = this.paymentQrCache[code];
    if (cached) {
      this.activePaymentQrUrl = cached;
      this.cdr.markForCheck();
      return;
    }

    this.paymentQrLoading = true;
    this.activePaymentQrUrl = null;
    this.cdr.markForCheck();
    this.subscriptionService.getPaymentQrBlob(code).subscribe({
      next: (blob) => {
        this.paymentQrLoading = false;
        const url = URL.createObjectURL(blob);
        this.paymentQrCache[code] = url;
        this.activePaymentQrUrl = url;
        this.cdr.markForCheck();
      },
      error: (err: { userMessage?: string }) => {
        this.paymentQrLoading = false;
        this.activePaymentQrUrl = null;
        this.paymentQrError = err?.userMessage || 'QR code non disponible.';
        this.cdr.markForCheck();
      }
    });
  }

  private revokePaymentQrCache(): void {
    Object.values(this.paymentQrCache).forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    this.paymentQrCache = {};
    this.activePaymentQrUrl = null;
  }

  canSubmitRequest(): boolean {
    return !!(
      this.selectedDuration &&
      this.proofFile &&
      this.isPaymentProviderEnabled(this.selectedPaymentProvider) &&
      !this.subscribing
    );
  }

  openProofPicker(): void {
    this.proofInput?.nativeElement.click();
  }

  onProofInputChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setProofFile(file);
    (event.target as HTMLInputElement).value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setProofFile(file);
  }

  setProofFile(file: File): void {
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Format non accepté',
        detail: 'Utilisez une image JPEG, PNG ou WebP.'
      });
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fichier trop volumineux',
        detail: 'La capture ne doit pas dépasser 5 Mo.'
      });
      return;
    }

    compressImageIfNeeded(file, MAX_IMAGE_BYTES)
      .then((processed) => {
        this.revokePreview();
        this.proofFile = processed;
        this.proofPreviewUrl = URL.createObjectURL(processed);
        this.cdr.markForCheck();
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
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de traiter l\'image'
        });
        this.cdr.markForCheck();
      });
  }

  clearProof(): void {
    this.proofFile = null;
    this.revokePreview();
    this.cdr.markForCheck();
  }

  private revokePreview(): void {
    if (this.proofPreviewUrl) {
      URL.revokeObjectURL(this.proofPreviewUrl);
      this.proofPreviewUrl = null;
    }
  }

  refreshQuote(): void {
    if (!this.selectedDuration) {
      this.quoteTotal = null;
      return;
    }
    this.subscriptionService
      .getQuote(this.selectedDuration.code)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: (q) => (this.quoteTotal = q.totalPrice),
        error: () => {
          this.quoteTotal = this.selectedDuration?.totalPrice ?? null;
        }
      });
  }

  submitRequest(): void {
    if (!this.selectedDuration || !this.proofFile) return;
    if (!this.isPaymentProviderEnabled(this.selectedPaymentProvider)) return;

    this.subscribing = true;
    this.cdr.markForCheck();
    this.subscriptionService
      .submitRequest(
        this.selectedDuration.code,
        this.selectedPaymentProvider.code,
        this.proofFile
      )
      .pipe(finalize(() => {
        this.subscribing = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.clearProof();
          this.messageService.add({
            severity: 'success',
            summary: 'Envoyé',
            detail: 'Validation par l\'administrateur sous 24 h'
          });
          this.loadAll();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err?.error?.message || 'Envoi impossible'
          });
        }
      });
  }

  openDetail(row: SubscriptionRecord): void {
    this.selectedRecord = row;
    this.detailDialogVisible = true;
    this.detailProofError = null;
    this.revokeDetailProof();
    if (row.proofUrl) {
      this.loadDetailProof(row.id);
    }
    this.cdr.markForCheck();
  }

  closeDetail(): void {
    this.detailDialogVisible = false;
    this.selectedRecord = null;
    this.revokeDetailProof();
    this.detailProofError = null;
    this.detailProofLoading = false;
    this.cdr.markForCheck();
  }

  private loadDetailProof(recordId: number): void {
    this.detailProofLoading = true;
    this.cdr.markForCheck();
    this.subscriptionService.getProofBlob(recordId).subscribe({
      next: (blob) => {
        this.detailProofUrl = URL.createObjectURL(blob);
        this.detailProofLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: { userMessage?: string }) => {
        this.detailProofLoading = false;
        this.detailProofError = err?.userMessage || 'Impossible d\'afficher le justificatif.';
        this.cdr.markForCheck();
      }
    });
  }

  private revokeDetailProof(): void {
    if (this.detailProofUrl) {
      URL.revokeObjectURL(this.detailProofUrl);
      this.detailProofUrl = null;
    }
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value) + ' F';
  }

  trackByDurationCode(_index: number, d: { code?: string }): string {
    return d.code ?? String(_index);
  }

  trackByPaymentProviderCode(_index: number, p: { code?: string }): string {
    return p.code ?? String(_index);
  }

  trackBySubscriptionId(_index: number, row: { id?: number }): number {
    return row.id ?? _index;
  }
}
