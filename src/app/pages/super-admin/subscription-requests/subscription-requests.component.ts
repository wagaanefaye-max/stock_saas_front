import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextarea } from 'primeng/inputtextarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { SubscriptionRecord, SubscriptionService } from '../../../services/subscription.service';
import { SuperAdminSubscriptionBadgeService } from '../../../services/super-admin-subscription-badge.service';
import { APP_DIALOG_BREAKPOINTS, APP_DIALOG_STYLE } from '../../../utils/dialog-mobile.util';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-subscription-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    ToastModule,
    DialogModule,
    InputTextarea,
    SelectButtonModule,
    PaginatorModule
  ],
  providers: [MessageService],
  templateUrl: './subscription-requests.component.html',
  styleUrl: './subscription-requests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionRequestsComponent implements OnInit, OnDestroy {
  requests: SubscriptionRecord[] = [];
  totalRecords = 0;
  statusFilter: StatusFilter = 'ALL';
  statusFilterOptions: { label: string; value: StatusFilter }[] = [];
  proofPreviewUrl: string | null = null;
  proofError: string | null = null;
  proofDialogVisible = false;
  selectedRequest: SubscriptionRecord | null = null;
  rejectDialogVisible = false;
  rejectReason = '';
  rejectPresetKey: string | null = null;
  rejectSubmitting = false;
  processingId: number | null = null;
  page = 0;
  rows = 10;
  first = 0;
  private statusCounts = { all: 0, pending: 0, approved: 0, rejected: 0 };
  readonly dialogStyle = APP_DIALOG_STYLE;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;

  readonly rejectPresets = [
    {
      key: 'amount',
      label: 'Montant incorrect',
      message: 'Le montant payé ne correspond pas au tarif de la durée sélectionnée.'
    },
    {
      key: 'proof',
      label: 'Capture illisible',
      message: 'Le justificatif de paiement est illisible ou incomplet. Merci de renvoyer une capture claire.'
    },
    {
      key: 'payment',
      label: 'Paiement non reçu',
      message: 'Nous n\'avons pas pu identifier le paiement sur le compte indiqué.'
    },
    {
      key: 'mismatch',
      label: 'Infos incohérentes',
      message: 'Les informations de la demande ne correspondent pas au justificatif fourni.'
    }
  ];

  constructor(
    private subscriptionService: SubscriptionService,
    private subscriptionBadgeService: SuperAdminSubscriptionBadgeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.revokeProofUrl();
  }

  loadRequests(): void {
    const status = this.statusFilter === 'ALL' ? undefined : this.statusFilter;
    this.subscriptionService
      .getAllRequests(this.page, this.rows, status)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: (response) => {
          this.requests = response.content;
          this.totalRecords = response.totalElements;
          this.first = response.page * response.size;
          this.statusCounts = {
            all: response.totalAll,
            pending: response.totalPending,
            approved: response.totalApproved,
            rejected: response.totalRejected
          };
          this.subscriptionBadgeService.setPendingCount(response.totalPending ?? 0);
          this.updateFilterOptions();
        },
        error: (err) =>
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err?.error?.message || 'Chargement impossible'
          })
      });
  }

  onFilterChange(): void {
    this.page = 0;
    this.first = 0;
    this.loadRequests();
  }

  onPageChange(event: { first?: number; rows?: number; page?: number }): void {
    const nextRows = event.rows ?? this.rows;
    this.rows = nextRows;
    this.page = event.first !== undefined
      ? Math.floor(event.first / nextRows)
      : (event.page ?? 0);
    this.first = this.page * this.rows;
    this.loadRequests();
  }

  updateFilterOptions(): void {
    this.statusFilterOptions = [
      { label: `Toutes (${this.statusCounts.all})`, value: 'ALL' },
      { label: `En attente (${this.statusCounts.pending})`, value: 'PENDING' },
      { label: `Validées (${this.statusCounts.approved})`, value: 'APPROVED' },
      { label: `Refusées (${this.statusCounts.rejected})`, value: 'REJECTED' }
    ];
  }

  isPending(row: SubscriptionRecord): boolean {
    return row.requestStatus === 'PENDING';
  }

  viewProof(req: SubscriptionRecord): void {
    this.revokeProofUrl();
    this.proofError = null;
    this.selectedRequest = req;
    this.proofDialogVisible = true;
    this.subscriptionService.getProofBlob(req.id).subscribe({
      next: (blob) => {
        this.proofPreviewUrl = URL.createObjectURL(blob);
      },
      error: (err: { userMessage?: string }) => {
        this.proofError = err?.userMessage || 'Impossible d\'afficher le justificatif.';
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: this.proofError
        });
      }
    });
  }

  closeProof(): void {
    this.proofDialogVisible = false;
    this.revokeProofUrl();
    this.proofError = null;
    this.selectedRequest = null;
  }

  private revokeProofUrl(): void {
    if (this.proofPreviewUrl) {
      URL.revokeObjectURL(this.proofPreviewUrl);
      this.proofPreviewUrl = null;
    }
  }

  approve(req: SubscriptionRecord): void {
    this.confirmationService.confirm({
      message: `Valider la souscription ${req.durationLabel} pour ${req.companyName} ?`,
      header: 'Confirmer la validation',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Oui, valider',
      rejectLabel: 'Annuler',
      accept: () => {
        this.processingId = req.id;
        this.subscriptionService
          .approveRequest(req.id)
          .pipe(finalize(() => (this.processingId = null)))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Validée',
                detail: 'L\'abonnement est maintenant actif'
              });
              this.closeProof();
              this.loadRequests();
            },
            error: (err) =>
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: err?.error?.message || 'Validation échouée'
              })
          });
      }
    });
  }

  openReject(req: SubscriptionRecord): void {
    this.selectedRequest = req;
    this.rejectReason = '';
    this.rejectPresetKey = null;
    this.rejectSubmitting = false;
    this.proofDialogVisible = false;
    this.rejectDialogVisible = true;
  }

  selectRejectPreset(preset: { key: string; label: string; message: string }): void {
    if (this.rejectPresetKey === preset.key) {
      this.rejectPresetKey = null;
      this.rejectReason = '';
      return;
    }
    this.rejectPresetKey = preset.key;
    this.rejectReason = preset.message;
  }

  onRejectReasonChange(): void {
    const match = this.rejectPresets.find((p) => p.message === this.rejectReason.trim());
    this.rejectPresetKey = match?.key ?? null;
  }

  closeRejectDialog(): void {
    if (this.rejectSubmitting) return;
    this.rejectDialogVisible = false;
  }

  onRejectDialogHide(): void {
    this.rejectReason = '';
    this.rejectPresetKey = null;
    this.rejectSubmitting = false;
  }

  confirmReject(): void {
    if (!this.selectedRequest || this.rejectSubmitting) return;

    const reason = this.rejectReason.trim();
    const id = this.selectedRequest.id;
    const company = this.selectedRequest.companyName;

    this.confirmationService.confirm({
      message: reason
        ? `Refuser la souscription de ${company} avec le motif indiqué ?`
        : `Refuser la souscription de ${company} ? Un motif par défaut sera enregistré.`,
      header: 'Confirmer le refus',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Refuser',
      rejectLabel: 'Retour',
      acceptButtonStyleClass: 'p-button-danger subscription-reject-btn',
      accept: () => this.executeReject(id, reason)
    });
  }

  private executeReject(id: number, reason: string): void {
    this.rejectSubmitting = true;
    this.processingId = id;
    this.subscriptionService
      .rejectRequest(id, reason || undefined)
      .pipe(
        finalize(() => {
          this.rejectSubmitting = false;
          this.processingId = null;
        })
      )
      .subscribe({
        next: () => {
          this.rejectDialogVisible = false;
          this.messageService.add({
            severity: 'info',
            summary: 'Demande refusée',
            detail: 'L\'entreprise peut soumettre une nouvelle demande avec un justificatif valide.'
          });
          this.closeProof();
          this.loadRequests();
        },
        error: (err) =>
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err?.error?.message || 'Le refus n\'a pas pu être enregistré'
          })
      });
  }

  statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warn';
      case 'REJECTED':
        return 'danger';
      default:
        return 'info';
    }
  }

  formatDate(value: string | null | undefined): string {
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
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }

  trackByRequestId(_index: number, row: { id?: number }): number {
    return row.id ?? _index;
  }

  trackByPresetKey(_index: number, preset: { key?: string }): string {
    return preset.key ?? String(_index);
  }
}
