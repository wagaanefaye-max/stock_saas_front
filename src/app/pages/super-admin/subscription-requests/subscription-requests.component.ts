import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextarea } from 'primeng/inputtextarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { SubscriptionRecord, SubscriptionService } from '../../../services/subscription.service';
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
    TableModule,
    TagModule,
    ToastModule,
    DialogModule,
    InputTextarea,
    SelectButtonModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './subscription-requests.component.html',
  styleUrl: './subscription-requests.component.scss'
})
export class SubscriptionRequestsComponent implements OnInit, OnDestroy {
  loading = true;
  allRequests: SubscriptionRecord[] = [];
  filteredRequests: SubscriptionRecord[] = [];
  statusFilter: StatusFilter = 'ALL';
  statusFilterOptions: { label: string; value: StatusFilter }[] = [];
  proofPreviewUrl: string | null = null;
  proofDialogVisible = false;
  selectedRequest: SubscriptionRecord | null = null;
  rejectDialogVisible = false;
  rejectReason = '';
  rejectPresetKey: string | null = null;
  rejectSubmitting = false;
  processingId: number | null = null;
  readonly dialogStyle = APP_DIALOG_STYLE;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;

  readonly rejectPresets = [
    {
      key: 'amount',
      label: 'Montant incorrect',
      message: 'Le montant payé ne correspond pas au tarif de l\'offre sélectionnée.'
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
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.revokeProofUrl();
  }

  loadAll(): void {
    this.loading = true;
    this.subscriptionService
      .getAllRequests()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (list) => {
          this.allRequests = list;
          this.updateFilterOptions();
          this.applyFilter();
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
    this.applyFilter();
  }

  updateFilterOptions(): void {
    this.statusFilterOptions = [
      { label: `Toutes (${this.countByStatus('ALL')})`, value: 'ALL' },
      { label: `En attente (${this.countByStatus('PENDING')})`, value: 'PENDING' },
      { label: `Validées (${this.countByStatus('APPROVED')})`, value: 'APPROVED' },
      { label: `Refusées (${this.countByStatus('REJECTED')})`, value: 'REJECTED' }
    ];
  }

  applyFilter(): void {
    if (this.statusFilter === 'ALL') {
      this.filteredRequests = [...this.allRequests];
    } else {
      this.filteredRequests = this.allRequests.filter((r) => r.requestStatus === this.statusFilter);
    }
  }

  countByStatus(status: StatusFilter): number {
    if (status === 'ALL') return this.allRequests.length;
    return this.allRequests.filter((r) => r.requestStatus === status).length;
  }

  isPending(row: SubscriptionRecord): boolean {
    return row.requestStatus === 'PENDING';
  }

  viewProof(req: SubscriptionRecord): void {
    this.revokeProofUrl();
    this.selectedRequest = req;
    this.proofDialogVisible = true;
    this.subscriptionService.getProofBlob(req.id).subscribe({
      next: (blob) => {
        this.proofPreviewUrl = URL.createObjectURL(blob);
      },
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d\'afficher le justificatif'
        })
    });
  }

  closeProof(): void {
    this.proofDialogVisible = false;
    this.revokeProofUrl();
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
      message: `Valider la souscription ${req.planLabel} (${req.durationLabel}) pour ${req.companyName} ?`,
      header: 'Confirmation',
      icon: 'pi pi-check-circle',
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
              this.loadAll();
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
      acceptButtonStyleClass: 'p-button-danger',
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
          this.loadAll();
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
}
