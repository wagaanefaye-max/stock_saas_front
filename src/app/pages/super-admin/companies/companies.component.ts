import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PhoneFormatDirective } from '../../../directives/phone-format.directive';
import { ApiService } from '../../../services/api.service';
import { Subject, catchError, debounceTime, finalize, of, takeUntil, throwError } from 'rxjs';
import {
  APP_DIALOG_BREAKPOINTS,
  APP_DIALOG_STYLE_LG,
  APP_DIALOG_STYLE_WIDE
} from '../../../utils/dialog-mobile.util';

interface Company {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  region: string | null;
  country: string | null;
  planCode: string | null;
  planLabel: string | null;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
  trialEndsAt: string | null;
  durationCode: string | null;
  statusCode: string | null;
  statusLabel: string | null;
  logoUrl: string | null;
  userCount: number;
  createdAt: string;
  adminName?: string | null;
  adminEmail?: string | null;
}

interface PageResponse {
  content: Company[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CardModule,
    TagModule,
    ToolbarModule,
    SelectModule,
    ToggleButtonModule,
    TooltipModule,
    DividerModule,
    ToastModule,
    PaginatorModule,
    PhoneFormatDirective
  ],
  providers: [MessageService],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompaniesComponent implements OnInit, OnDestroy {
  readonly dialogStyle = APP_DIALOG_STYLE_WIDE;
  readonly dialogStyleDetail = APP_DIALOG_STYLE_LG;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;

  companies: Company[] = [];
  selectedCompanies: Company[] = [];
  displayDialog = false;
  company: any = {};
  globalFilter = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  statuses = [
    { label: 'Actif', value: 'Actif' },
    { label: 'Inactif', value: 'Inactif' },
    { label: 'Suspendu', value: 'Suspendu' }
  ];
  
  // Pagination
  totalRecords = 0;
  page = 0;
  size = 10;
  
  regions = [
    'Dakar',
    'Thiès',
    'Diourbel',
    'Saint-Louis',
    'Tambacounda',
    'Kaolack',
    'Louga',
    'Fatick',
    'Kolda',
    'Ziguinchor',
    'Kaffrine',
    'Matam',
    'Kédougou',
    'Sédhiou'
  ];
  
  companyLogo: File | null = null;
  companyLogoPreview: string | null = null;
  displayDetailDialog = false;
  companyDetail: Company | null = null;

  constructor(
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCompanies();
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.loadCompanies());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCompanies() {
    const search = this.globalFilter && this.globalFilter.trim() ? this.globalFilter.trim() : undefined;

    this.apiService.get<PageResponse>(`/companies?page=${this.page}&size=${this.size}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des entreprises:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les entreprises'
          });
          return of({
            content: [],
            page: 0,
            size: this.size,
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true
          } as PageResponse);
        })
      )
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe(response => {
        this.companies = response.content;
        this.totalRecords = response.totalElements;
      });
  }

  onPageChange(event: any) {
    if (event.first !== undefined) {
      // Événement de pagination PrimeNG
      this.page = Math.floor(event.first / event.rows);
      this.size = event.rows;
    } else {
      // Événement personnalisé
      this.page = event.page || 0;
      this.size = event.rows || event.size || 10;
    }
    this.loadCompanies();
  }

  onGlobalFilter() {
    this.page = 0;
    this.search$.next();
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return date;
    }
  }

  getSeverity(statusCode: string | null): 'success' | 'danger' | 'warn' | undefined {
    if (!statusCode) return undefined;
    switch (statusCode.toUpperCase()) {
      case 'ACTIF':
        return 'success';
      case 'INACTIF':
        return 'danger';
      case 'SUSPENDU':
        return 'warn';
      default:
        return undefined;
    }
  }

  getStatusLabel(statusCode: string | null): string {
    if (!statusCode) return '-';
    const company = this.companies.find(c => c.statusCode === statusCode);
    return company?.statusLabel || statusCode;
  }

  getSubscriptionLabel(company: Company): string {
    switch (company.subscriptionStatus) {
      case 'TRIAL':
        return 'Essai gratuit';
      case 'ACTIVE':
        return 'Abonnement actif';
      case 'EXPIRED':
        return 'Expiré';
      default:
        return company.subscriptionStatus || '—';
    }
  }

  getSubscriptionSeverity(company: Company): 'success' | 'info' | 'warn' | 'secondary' | undefined {
    switch (company.subscriptionStatus) {
      case 'TRIAL':
        return 'info';
      case 'ACTIVE':
        return 'success';
      case 'EXPIRED':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  openNew() {
    this.company = {
      statusCode: 'Actif',
      country: 'Sénégal',
      phone: '',
      address: '',
      region: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: ''
    };
    this.companyLogo = null;
    this.companyLogoPreview = null;
    this.displayDialog = true;
  }

  showDetail(company: Company) {
    this.apiService.get<Company>(`/companies/${company.id}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement de l\'entreprise:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les détails de l\'entreprise'
          });
          return of(null);
        })
      )
      .subscribe(fetchedCompany => {
        if (fetchedCompany) {
          this.companyDetail = fetchedCompany;
          this.displayDetailDialog = true;
        }
      });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Vérifier le type de fichier (images uniquement)
      if (!file.type.match(/image\/(png|jpg|jpeg|gif|webp)/)) {
        alert('Veuillez sélectionner une image (PNG, JPG, JPEG, GIF ou WEBP)');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      this.companyLogo = file;
      
      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyLogoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.companyLogo = null;
    this.companyLogoPreview = null;
    if (this.company.logoUrl) {
      this.company.logoUrl = null;
    }
  }
  
  isFormValid(): boolean {
    return !!(this.company.name && 
             this.company.email && 
             this.company.phone && 
             this.company.address && 
             this.company.region && 
             this.company.adminFirstName &&
             this.company.adminLastName &&
             this.company.adminEmail);
  }

  saveCompany() {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }
    
    if (!this.company.id) {
      const createRequest = {
        name: this.company.name,
        email: this.company.email,
        phone: this.company.phone || null,
        address: this.company.address || null,
        region: this.company.region || null,
        country: this.company.country || 'Sénégal',
        adminFirstName: this.company.adminFirstName,
        adminLastName: this.company.adminLastName,
        adminEmail: this.company.adminEmail
      };
      this.apiService.post<Company>('/companies', createRequest)
        .pipe(
          catchError(error => {
            console.error('Erreur lors de la création de l\'entreprise:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: error.error?.message || 'Impossible de créer l\'entreprise'
            });
            return throwError(() => error);
          })
        )
        .subscribe(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Boutique créée. Un email d\'activation a été envoyé à l\'administrateur pour qu\'il active son compte et définisse son mot de passe.'
          });
          this.displayDialog = false;
          this.companyLogo = null;
          this.companyLogoPreview = null;
          this.loadCompanies();
        });
      return;
    }
  }

  deleteCompany(company: Company) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'entreprise "${company.name}" ? Cette action est irréversible et supprimera toutes les données associées.`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Non, annuler',
      accept: () => {
        this.apiService.delete(`/companies/${company.id}`)
          .pipe(
            catchError(error => {
              console.error('Erreur lors de la suppression de l\'entreprise:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: error.error?.message || 'Impossible de supprimer l\'entreprise'
              });
              return throwError(() => error);
            })
          )
          .subscribe(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: `L'entreprise "${company.name}" a été supprimée.`
            });
            this.loadCompanies(); // Recharger la liste
          });
      }
    });
  }

  private resolveCompanyStatusCode(company: Company): 'ACTIF' | 'INACTIF' | 'SUSPENDU' {
    const raw = String(company.statusCode ?? company.statusLabel ?? '').trim().toUpperCase();
    if (raw === 'INACTIF' || raw.includes('INACTIF')) {
      return 'INACTIF';
    }
    if (raw === 'SUSPENDU' || raw.includes('SUSPENDU')) {
      return 'SUSPENDU';
    }
    return 'ACTIF';
  }

  isCompanyActive(company: Company): boolean {
    return this.resolveCompanyStatusCode(company) === 'ACTIF';
  }

  toggleCompanyStatus(company: Company) {
    const isActive = this.isCompanyActive(company);
    const newStatus = isActive ? 'Inactif' : 'Actif';
    const action = isActive ? 'désactiver' : 'activer';
    
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir ${action} l'entreprise "${company.name}" ?`,
      header: `Confirmer ${isActive ? 'la désactivation' : 'l\'activation'}`,
      icon: 'pi pi-question-circle',
      acceptLabel: `Oui, ${action}`,
      rejectLabel: 'Non, annuler',
      accept: () => {
        this.apiService.patch<Company>(`/companies/${company.id}/status`, { status: newStatus })
          .pipe(
            catchError(error => {
              console.error('Erreur lors du changement de statut:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: error.error?.message || 'Impossible de changer le statut de l\'entreprise'
              });
              return throwError(() => error);
            })
          )
          .subscribe(updatedCompany => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: `Le statut de l'entreprise "${company.name}" a été changé en "${isActive ? 'Inactif' : 'Actif'}".`
            });
            this.loadCompanies(); // Recharger la liste
          });
      }
    });
  }

  trackByCompanyId(_index: number, company: { id?: number }): number {
    return company.id ?? _index;
  }
}

