import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { APP_DIALOG_BREAKPOINTS, APP_DIALOG_STYLE } from '../../../utils/dialog-mobile.util';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import {
  PAYMENT_PROVIDERS,
  SubscriptionDuration,
  SubscriptionPlan,
  SubscriptionRecord,
  SubscriptionService,
  SubscriptionStatus
} from '../../../services/subscription.service';

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-company-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, DialogModule, ButtonModule],
  providers: [MessageService],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss'
})
export class CompanySubscriptionsComponent implements OnInit, OnDestroy {
  @ViewChild('proofInput') proofInput?: ElementRef<HTMLInputElement>;

  loading = true;
  subscribing = false;
  showHistory = false;
  status: SubscriptionStatus | null = null;
  plans: SubscriptionPlan[] = [];
  durations: SubscriptionDuration[] = [];
  history: SubscriptionRecord[] = [];
  paymentProviders = PAYMENT_PROVIDERS;
  selectedPlan: SubscriptionPlan | null = null;
  selectedDuration: SubscriptionDuration | null = null;
  selectedPaymentProvider = PAYMENT_PROVIDERS.find((p) => p.enabled !== false) ?? PAYMENT_PROVIDERS[0];
  proofFile: File | null = null;
  proofPreviewUrl: string | null = null;
  isDragOver = false;
  quoteTotal: number | null = null;
  detailDialogVisible = false;
  selectedRecord: SubscriptionRecord | null = null;
  detailProofUrl: string | null = null;
  detailProofLoading = false;
  detailProofError: string | null = null;
  readonly dialogStyle = APP_DIALOG_STYLE;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;

  constructor(
    private subscriptionService: SubscriptionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.revokePreview();
    this.revokeDetailProof();
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      status: this.subscriptionService.getStatus(),
      plans: this.subscriptionService.getPlans(),
      durations: this.subscriptionService.getDurations(),
      history: this.subscriptionService.getHistory().pipe(catchError(() => of([])))
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ status, plans, durations, history }) => {
          this.status = status;
          this.plans = plans;
          this.durations = durations;
          this.history = history;
          const preferred = plans.find((p) => p.code === 'Standard') ?? plans[0];
          if (preferred && !this.selectedPlan) {
            this.selectedPlan = preferred;
          }
          if (durations.length && !this.selectedDuration) {
            this.selectedDuration = durations.find((d) => d.code === 'MONTH_3') ?? durations[0];
          }
          this.refreshQuote();
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
      this.messageService.add({ severity: 'warn', summary: 'Image JPEG, PNG ou WebP uniquement' });
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      this.messageService.add({ severity: 'warn', summary: 'Max. 5 Mo' });
      return;
    }
    this.revokePreview();
    this.proofFile = file;
    this.proofPreviewUrl = URL.createObjectURL(file);
  }

  clearProof(): void {
    this.proofFile = null;
    this.revokePreview();
  }

  private revokePreview(): void {
    if (this.proofPreviewUrl) {
      URL.revokeObjectURL(this.proofPreviewUrl);
      this.proofPreviewUrl = null;
    }
  }

  refreshQuote(): void {
    if (!this.selectedPlan || !this.selectedDuration) {
      this.quoteTotal = null;
      return;
    }
    this.subscriptionService
      .getQuote(this.selectedPlan.code, this.selectedDuration.code)
      .subscribe({
        next: (q) => (this.quoteTotal = q.totalPrice),
        error: () => {
          this.quoteTotal = this.selectedDuration?.totalPrice ?? null;
        }
      });
  }

  submitRequest(): void {
    if (!this.selectedPlan || !this.selectedDuration || !this.proofFile) return;
    if (!this.isPaymentProviderEnabled(this.selectedPaymentProvider)) return;

    this.subscribing = true;
    this.subscriptionService
      .submitRequest(
        this.selectedPlan.code,
        this.selectedDuration.code,
        this.selectedPaymentProvider.code,
        this.proofFile
      )
      .pipe(finalize(() => (this.subscribing = false)))
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
  }

  closeDetail(): void {
    this.detailDialogVisible = false;
    this.selectedRecord = null;
    this.revokeDetailProof();
    this.detailProofError = null;
    this.detailProofLoading = false;
  }

  private loadDetailProof(recordId: number): void {
    this.detailProofLoading = true;
    this.subscriptionService.getProofBlob(recordId).subscribe({
      next: (blob) => {
        this.detailProofUrl = URL.createObjectURL(blob);
        this.detailProofLoading = false;
      },
      error: () => {
        this.detailProofLoading = false;
        this.detailProofError = 'Impossible d\'afficher le justificatif.';
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
}
