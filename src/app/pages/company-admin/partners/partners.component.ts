import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { PhoneFormatDirective } from '../../../directives/phone-format.directive';
import { PhoneFormatPipe } from '../../../pipes/phone-format.pipe';
import { APP_DIALOG_BREAKPOINTS, APP_DIALOG_STYLE_LG } from '../../../utils/dialog-mobile.util';
@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CardModule,
    SelectModule,
    SelectButtonModule,
    ToastModule,
    TagModule,
    PaginatorModule,
    PhoneFormatDirective,
    PhoneFormatPipe
  ],
  providers: [MessageService],
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.scss'
})
export class PartnersComponent implements OnInit {
  readonly dialogStyle = APP_DIALOG_STYLE_LG;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;

  partners: any[] = [];
  totalPartners = 0;
  rows = 10;
  first = 0;
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  displayDialog = false;
  partner: any = {};
  selectedRoleFilter: string = '';
  globalFilter = '';

  roleOptions = [
    { label: 'Client', value: 'CLIENT' },
    { label: 'Fournisseur', value: 'FOURNISSEUR' }
  ];
  roleFilterOptions = [
    { label: 'Tous', value: '' },
    ...this.roleOptions
  ];

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  trackByPartnerId(_index: number, partner: { id?: number }): number {
    return partner.id ?? _index;
  }

  ngOnInit() {
    this.loadPartners({ first: 0, rows: this.rows });
  }

  loadPartners(event: { first: number; rows: number }) {
    const page = event.first / event.rows;
    const size = event.rows;
    const params: Record<string, string | number> = {
      page,
      size
    };
    if (this.selectedRoleFilter) params['role'] = this.selectedRoleFilter;
    if (this.globalFilter?.trim()) params['search'] = this.globalFilter.trim();
    this.apiService.get<{ content: any[]; totalElements: number }>('/partners', params).subscribe({
      next: (data) => {
        this.partners = data?.content ?? [];
        this.totalPartners = data?.totalElements ?? 0;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les partenaires', life: 5000 });
      }
    });
  }

  onPartnersLazyLoad(event: any) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    this.loadPartners({ first: this.first, rows: this.rows });
  }

  private refreshPartners() {
    this.loadPartners({ first: this.first, rows: this.rows });
  }

  onRoleFilterChange() {
    this.first = 0;
    this.loadPartners({ first: 0, rows: this.rows });
  }

  onSearchInput() {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.first = 0;
      this.loadPartners({ first: 0, rows: this.rows });
    }, 400);
  }

  openNew() {
    this.partner = { role: 'CLIENT' };
    this.displayDialog = true;
  }

  editPartner(p: any) {
    this.partner = { ...p, phone: this.formatPhone(p.phone) || p.phone || '' };
    this.displayDialog = true;
  }

  /** Format affichage/saisie : 78 900 88 77 */
  private formatPhone(value: string | null | undefined): string {
    if (value == null || value === '') return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    const d = digits.substring(0, 9);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.substring(0, 2)} ${d.substring(2)}`;
    if (d.length <= 7) return `${d.substring(0, 2)} ${d.substring(2, 5)} ${d.substring(5)}`;
    return `${d.substring(0, 2)} ${d.substring(2, 5)} ${d.substring(5, 7)} ${d.substring(7, 9)}`;
  }

  savePartner() {
    if (!this.partner.name?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Nom requis', detail: 'Le nom est obligatoire', life: 4000 });
      return;
    }
    const payload = {
      role: this.partner.role,
      name: this.partner.name.trim(),
      email: this.partner.email?.trim() || null,
      phone: this.partner.phone?.trim() || null,
      address: this.partner.address || null,
      description: this.partner.description || null
    };
    if (this.partner.id) {
      this.apiService.put<any>(`/partners/${this.partner.id}`, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Modifié', detail: 'Partenaire mis à jour', life: 4000 });
          this.displayDialog = false;
          this.refreshPartners();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Erreur lors de la mise à jour', life: 5000 });
        }
      });
    } else {
      this.apiService.post<any>('/partners', payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Créé', detail: 'Partenaire créé', life: 4000 });
          this.displayDialog = false;
          this.first = 0;
          this.loadPartners({ first: 0, rows: this.rows });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Erreur lors de la création', life: 5000 });
        }
      });
    }
  }

  deletePartner(p: any) {
    this.confirmationService.confirm({
      message: `Supprimer le partenaire « ${p.name } » ?`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.apiService.delete(`/partners/${p.id}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Supprimé',
              detail: 'Le partenaire a été supprimé.',
              life: 4000
            });
            this.refreshPartners();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer', life: 5000 });
          }
        });
      }
    });
  }

  getRoleLabel(role: string) {
    return role === 'FOURNISSEUR' ? 'Fournisseur' : 'Client';
  }

  getRoleSeverity(role: string): 'success' | 'info' | undefined {
    return role === 'FOURNISSEUR' ? 'info' : 'success';
  }
}
