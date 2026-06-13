import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';
import { PhoneFormatPipe } from '../../../pipes/phone-format.pipe';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { Invoice } from '../../../models';
import {
  APP_DIALOG_BREAKPOINTS,
  APP_DIALOG_STYLE_LG,
  APP_DIALOG_STYLE_DETAIL
} from '../../../utils/dialog-mobile.util';

interface InvoiceLineRow {
  productId: number | null;
  productName?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  /** Stock disponible du produit (max quantité saisissable) */
  availableQuantity?: number;
}

/** Produit avec label pour le select (nom - ref - quantité) et filtré stock > 0 */
interface ProductForInvoice {
  id: number;
  name: string;
  reference: string | null;
  stock: number;
  price: number;
  productLabel: string;
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    CardModule,
    SelectModule,
    ToastModule,
    TagModule,
    SelectButtonModule,
    CheckboxModule,
    PhoneFormatPipe,
    PaginatorModule
  ],
  providers: [MessageService],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  readonly dialogStyle = APP_DIALOG_STYLE_LG;
  readonly dialogStyleDetail = APP_DIALOG_STYLE_DETAIL;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;
  mobileRows = 10;
  mobileFirst = 0;
  displayCreateDialog = false;
  displayEditDialog = false;
  displayDetailDialog = false;
  selectedInvoice: Invoice | null = null;
  /** ID de la facture en cours d'édition (brouillon uniquement) */
  editingInvoiceId: number | null = null;
  /** Nom du client (lecture seule) en édition */
  editClientName = '';
  clients: any[] = [];
  /** Total nombre de clients (pour pagination lazy) */
  clientsTotal = 0;
  /** Recherche serveur : nom, prénom ou email */
  clientSearchTerm = '';
  readonly clientsPageSize = 10;
  /** Produits avec stock > 0, pour le select facture (nom - ref - quantité) */
  productsForInvoice: ProductForInvoice[] = [];
  /** Filtres liste factures (envoyés au backend) */
  invoiceNumberFilter = '';
  clientNameFilter = '';
  /** Filtre de statut : ALL = toutes, PAID = payées, UNPAID = non payées */
  statusFilter: 'ALL' | 'PAID' | 'UNPAID' = 'ALL';
  statusFilterOptions = [
    { label: 'Toutes', value: 'ALL' },
    { label: 'Payées', value: 'PAID' },
    { label: 'Impayées', value: 'UNPAID' }
  ];

  createForm = {
    clientId: null as number | null,
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '' as string,
    markAsPaid: false,
    notes: '' as string,
    lines: [] as InvoiceLineRow[]
  };

  editForm = {
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '' as string,
    markAsPaid: false,
    notes: '' as string,
    lines: [] as InvoiceLineRow[]
  };

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInvoices();
    this.route.queryParams.subscribe(params => {
      if (params['new'] === '1') {
        this.openCreateDialog();
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, queryParamsHandling: '', replaceUrl: true });
      }
    });
  }

  loadInvoices() {
    const statusParam =
      this.statusFilter === 'ALL'
        ? null
        : this.statusFilter === 'UNPAID'
          ? 'UNPAID'
          : 'PAID';

    const params: Record<string, string | null> = {
      status: statusParam,
      invoiceNumber: this.invoiceNumberFilter?.trim() || null,
      clientName: this.clientNameFilter?.trim() || null
    };

    this.apiService.get<Invoice[]>('/invoices', params).subscribe({
      next: (data) => {
        this.invoices = data || [];
        this.mobileFirst = 0;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les factures', life: 5000 });
      }
    });
  }

  /** La liste est déjà filtrée par le backend. */
  get filteredInvoices(): Invoice[] {
    return this.invoices;
  }

  get paginatedInvoices(): Invoice[] {
    return this.filteredInvoices.slice(this.mobileFirst, this.mobileFirst + this.mobileRows);
  }

  onMobilePageChange(event: { first?: number; rows?: number }): void {
    if (event.rows != null) {
      this.mobileRows = event.rows;
    }
    this.mobileFirst = event.first ?? 0;
  }

  openCreateDialog() {
    const today = new Date();
    const dueDefault = new Date(today);
    dueDefault.setDate(dueDefault.getDate() + 30);
    this.createForm = {
      clientId: null,
      invoiceDate: today.toISOString().slice(0, 10),
      dueDate: dueDefault.toISOString().slice(0, 10),
      markAsPaid: false,
      notes: '',
      lines: []
    };
    this.clients = [];
    this.clientsTotal = 0;
    this.clientSearchTerm = '';


    this.displayCreateDialog = true;
  }

  loadProducts(){
    if (this.productsForInvoice.length > 0) return;
    this.apiService.get<any[]>('/products').subscribe({
      next: (data) => {
        const list = (data || []) as any[];
        const withStock = list.filter(p => (Number(p.stock) ?? 0) > 0);
        this.productsForInvoice = withStock.map(p => ({
          id: p.id,
          name: p.name,
          reference: p.reference ?? null,
          stock: Number(p.stock) || 0,
          price: Number(p.price) || 0,
          productLabel: `${p.name} - ${p.reference || '-'} - ${Number(p.stock) || 0}`
        }));
      },
      error: () => { this.productsForInvoice = []; }
    });
  }

  /** Charge une page de clients (pagination + recherche backend). */
  loadClientsPage(page: number) {

    const params: Record<string, string | number> = {
      role: 'CLIENT',
      page,
      size: this.clientsPageSize
    };
    if (this.clientSearchTerm?.trim()) {
      params['search'] = this.clientSearchTerm.trim();
    }
    this.apiService.get<{ content: any[]; totalElements: number }>('/partners', params).subscribe({
      next: (res) => {
        const list = res?.content ?? [];
        const total = res?.totalElements ?? 0;
        if (page === 0) {
          this.clients = list;
        } else {
          this.clients = [...this.clients, ...list];
        }
        this.clientsTotal = total;
      },
      error: () => {
        if (page === 0) this.clients = [];
      }
    });
  }

  /** Filtre serveur : recherche par nom, prénom ou email. */
  onClientFilter(event: { filter: string | null }) {
    this.clientSearchTerm = (event.filter ?? '').trim();
    this.loadClientsPage(0);
  }

  /** Lazy load : charger la page suivante quand l'utilisateur scrolle en bas. */
  onClientsLazyLoad(event: { first: number; last: number }) {
    const last = event.last ?? 0;
    if (last >= this.clients.length - 1 && this.clients.length < this.clientsTotal) {
      const nextPage = Math.floor(this.clients.length / this.clientsPageSize);
      this.loadClientsPage(nextPage);
    }
  }

  addLine() {
    this.createForm.lines.push({
      productId: null,
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      availableQuantity: undefined
    });
  }

  removeLine(index: number) {
    this.createForm.lines.splice(index, 1);
  }

  onProductSelect(index: number) {
    const row = this.createForm.lines[index];
    const product = this.productsForInvoice.find(p => p.id === row.productId);
    if (product) {
      row.productName = product.name;
      row.unitPrice = product.price;
      row.availableQuantity = product.stock;
      const maxQty = Math.max(0, product.stock);
      if ((row.quantity || 0) > maxQty) {
        row.quantity = maxQty;
      }
      this.updateLineAmount(index);
    }
  }

  updateLineAmount(index: number) {
    const row = this.createForm.lines[index];
    const maxQty = row.availableQuantity ?? 0;
    let qty = Number(row.quantity) || 0;
    if (maxQty > 0 && qty > maxQty) {
      row.quantity = maxQty;
      qty = maxQty;
    }
    row.amount = qty * (Number(row.unitPrice) || 0);
  }

  get createSubtotal(): number {
    return this.createForm.lines.reduce((sum, l) => sum + (l.amount || 0), 0);
  }

  get editSubtotal(): number {
    return this.editForm.lines.reduce((sum, l) => sum + (l.amount || 0), 0);
  }

  openEditDialog(inv: any) {
    this.editingInvoiceId = inv.id;
    this.editClientName = inv.clientName || '';
    this.apiService.get<any>(`/invoices/${inv.id}`).subscribe({
      next: (data) => {
        this.editForm = {
          invoiceDate: (data.invoiceDate && String(data.invoiceDate).slice(0, 10)) || new Date().toISOString().slice(0, 10),
          dueDate: (data.dueDate && String(data.dueDate).slice(0, 10)) || '',
          markAsPaid: data.status === 'PAID',
          notes: data.notes || '',
          lines: (data.lines || []).map((l: any) => ({
            productId: l.productId,
            productName: l.productName,
            quantity: Number(l.quantity) || 0,
            unitPrice: Number(l.unitPrice) || 0,
            amount: Number(l.amount) || 0,
            availableQuantity: undefined as number | undefined
          }))
        };
        this.apiService.get<any[]>('/products').subscribe({
          next: (products) => {
            const list = (products || []) as any[];
            const withStock = list.filter((p: any) => (Number(p.stock) ?? 0) > 0);
            this.productsForInvoice = withStock.map((p: any) => ({
              id: p.id,
              name: p.name,
              reference: p.reference ?? null,
              stock: Number(p.stock) || 0,
              price: Number(p.price) || 0,
              productLabel: `${p.name} - ${p.reference || '-'} - ${Number(p.stock) || 0}`
            }));
            this.editForm.lines.forEach((row, idx) => {
              const p = this.productsForInvoice.find(pr => pr.id === row.productId);
              if (p) row.availableQuantity = p.stock;
            });
          },
          error: () => { this.productsForInvoice = []; }
        });
        this.displayEditDialog = true;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger la facture', life: 5000 });
      }
    });
  }

  addEditLine() {
    this.editForm.lines.push({
      productId: null,
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      availableQuantity: undefined
    });
  }

  removeEditLine(index: number) {
    this.editForm.lines.splice(index, 1);
  }

  onProductSelectEdit(index: number) {
    const row = this.editForm.lines[index];
    const product = this.productsForInvoice.find(p => p.id === row.productId);
    if (product) {
      row.productName = product.name;
      row.unitPrice = product.price;
      row.availableQuantity = product.stock;
      const maxQty = Math.max(0, product.stock);
      if ((row.quantity || 0) > maxQty) row.quantity = maxQty;
      this.updateLineAmountEdit(index);
    }
  }

  updateLineAmountEdit(index: number) {
    const row = this.editForm.lines[index];
    const maxQty = row.availableQuantity ?? 0;
    let qty = Number(row.quantity) || 0;
    if (maxQty > 0 && qty > maxQty) {
      row.quantity = maxQty;
      qty = maxQty;
    }
    row.amount = qty * (Number(row.unitPrice) || 0);
  }

  saveEditInvoice() {
    if (this.editingInvoiceId == null) return;
    if (this.editForm.markAsPaid && !this.editForm.dueDate?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Date d\'échéance requise', detail: 'La date d\'échéance est obligatoire pour une facture marquée comme payée', life: 4000 });
      return;
    }
    if (!this.editForm.lines.length || this.editForm.lines.some(l => !l.productId || (l.quantity || 0) <= 0)) {
      this.messageService.add({ severity: 'warn', summary: 'Lignes invalides', detail: 'Au moins une ligne avec produit et quantité requise', life: 4000 });
      return;
    }
    const overStock = this.editForm.lines.find(l => l.availableQuantity != null && (l.quantity || 0) > l.availableQuantity);
    if (overStock) {
      this.messageService.add({ severity: 'warn', summary: 'Quantité invalide', detail: 'Une ligne dépasse le stock disponible', life: 4000 });
      return;
    }
    const payload = {
      invoiceDate: this.editForm.invoiceDate,
      dueDate: this.editForm.dueDate || null,
      status: this.editForm.markAsPaid ? 'PAID' : 'DRAFT',
      notes: this.editForm.notes || null,
      lines: this.editForm.lines.map(l => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice
      }))
    };
    this.apiService.put<any>(`/invoices/${this.editingInvoiceId}`, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Facture modifiée',
          detail: 'Les modifications ont été enregistrées.',
          life: 4000
        });
        this.displayEditDialog = false;
        this.editingInvoiceId = null;
        this.loadInvoices();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible de modifier la facture', life: 5000 });
      }
    });
  }

  saveInvoice() {
    if (this.createForm.markAsPaid && !this.createForm.dueDate?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Date d\'échéance requise', detail: 'La date d\'échéance est obligatoire pour une facture marquée comme payée', life: 4000 });
      return;
    }
    if (!this.createForm.lines.length || this.createForm.lines.some(l => !l.productId || (l.quantity || 0) <= 0)) {
      this.messageService.add({ severity: 'warn', summary: 'Lignes invalides', detail: 'Ajoutez au moins une ligne avec un produit et une quantité', life: 4000 });
      return;
    }
    const overStock = this.createForm.lines.find(l => l.availableQuantity != null && (l.quantity || 0) > l.availableQuantity);
    if (overStock) {
      this.messageService.add({ severity: 'warn', summary: 'Quantité invalide', detail: 'Une ligne dépasse le stock disponible', life: 4000 });
      return;
    }
    const payload = {
      clientId: this.createForm.clientId,
      invoiceDate: this.createForm.invoiceDate,
      dueDate: this.createForm.dueDate || null,
      status: this.createForm.markAsPaid ? 'PAID' : 'DRAFT',
      notes: this.createForm.notes || null,
      lines: this.createForm.lines.map(l => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice
      }))
    };
    this.apiService.post<Invoice>('/invoices', payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Facture créée',
          detail: 'La facture a été enregistrée avec succès.',
          life: 4000
        });
        this.displayCreateDialog = false;
        this.statusFilter = 'ALL';
        this.invoiceNumberFilter = '';
        this.clientNameFilter = '';
        this.loadInvoices();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible de créer la facture', life: 5000 });
      }
    });
  }

  /**
   * Ouvre WhatsApp (web ou app) avec un message pré-rempli contenant le lien de téléchargement de la facture.
   */
  openWhatsAppWithInvoiceLink(rawPhone: string, downloadUrl: string, invoiceNumber?: string | null) {
    const phone = (rawPhone || '').replace(/\D/g, '');
    if (!phone) {
      this.messageService.add({ severity: 'warn', summary: 'Numéro client invalide', detail: 'Le numéro de téléphone du client est manquant ou invalide', life: 4000 });
      return;
    }
    const label = invoiceNumber ? `facture ${invoiceNumber}` : 'votre facture';
    const text = `Bonjour, voici le lien pour télécharger ${label} : ${downloadUrl}`;
    const encodedText = encodeURIComponent(text);
    const waUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  }

  viewInvoice(inv: any) {
    this.selectedInvoice = null;
    this.displayDetailDialog = true;
    this.apiService.get<any>(`/invoices/${inv.id}`).subscribe({
      next: (data) => {
        this.selectedInvoice = data;
      },
      error: () => {
        this.displayDetailDialog = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger la facture', life: 5000 });
      }
    });
  }

  downloadPdf(inv: any) {
    this.apiService.getBlob(`/invoices/${inv.id}/pdf`).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${(inv.invoiceNumber || inv.id).replace(/\s/g, '-')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: 'PDF téléchargé',
          detail: 'Le fichier a été enregistré sur votre appareil.',
          life: 3000
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de générer le PDF', life: 5000 });
      }
    });
  }

  hasClientPhone(inv: { clientPhone?: string | null }): boolean {
    return !!(inv?.clientPhone && String(inv.clientPhone).replace(/\D/g, '').length >= 8);
  }

  sendInvoiceToWhatsApp(inv: any) {
    if (!inv?.id) return;
    this.apiService.get<any>(`/invoices/${inv.id}`).subscribe({
      next: (fullInvoice) => {
        const phone = fullInvoice?.clientPhone;
        const url = fullInvoice?.publicDownloadUrl;
        if (!this.hasClientPhone(fullInvoice)) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Téléphone manquant',
            detail: 'Renseignez le numéro du client dans la fiche partenaire (Clients) puis réessayez.',
            life: 6000
          });
          return;
        }
        if (!url) {
          this.messageService.add({
            severity: 'error',
            summary: 'Lien indisponible',
            detail: 'Impossible de générer le lien de téléchargement. Réessayez dans quelques instants.',
            life: 5000
          });
          return;
        }
        this.openWhatsAppWithInvoiceLink(phone, url, fullInvoice?.invoiceNumber);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de préparer l’envoi WhatsApp.',
          life: 5000
        });
      }
    });
  }

  markAsPaid(inv: any) {
    if (inv.status === 'PAID') {
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const payload: any = {
      status: 'PAID',
      dueDate: inv.dueDate || todayStr
    };
    this.confirmationService.confirm({
      message: `Marquer la facture « ${inv.invoiceNumber } » comme payée ?`,
      header: 'Confirmer le paiement',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Oui, marquer payée',
      rejectLabel: 'Annuler',
      accept: () => {
        this.apiService.put<Invoice>(`/invoices/${inv.id}`, payload).subscribe({
          next: (updated) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Facture marquée comme payée',
              detail: 'Le statut de la facture a été mis à jour.',
              life: 4000
            });
            this.loadInvoices();
            if (updated?.clientPhone && updated.publicDownloadUrl) {
              this.openWhatsAppWithInvoiceLink(updated.clientPhone, updated.publicDownloadUrl, updated.invoiceNumber);
            }
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible de marquer la facture comme payée', life: 5000 });
          }
        });
      }
    });
  }

  printInvoice(inv: any) {
    this.apiService.getBlob(`/invoices/${inv.id}/pdf`).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url);
        if (!printWindow) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Impression bloquée',
            detail: 'Autorisez les fenêtres pop-up pour imprimer la facture',
            life: 5000
          });
          return;
        }
        printWindow.addEventListener('load', () => {
          printWindow.focus();
          printWindow.print();
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de générer le PDF pour impression',
          life: 5000
        });
      }
    });
  }

  deleteInvoice(inv: any) {
    this.confirmationService.confirm({
      message: `Supprimer la facture « ${inv.invoiceNumber } » ?`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.apiService.delete(`/invoices/${inv.id}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Facture supprimée',
              detail: 'La facture a été retirée de la liste.',
              life: 4000
            });
            this.loadInvoices();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer', life: 5000 });
          }
        });
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'PAID': return 'success';
      case 'SENT': return 'info';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  }

  formatDate(d: string | null): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR');
  }

  formatMoney(value: number | null | undefined): string {
    if (value == null) return '-';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + ' FCFA';
  }
}
