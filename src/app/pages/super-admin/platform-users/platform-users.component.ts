import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
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
import { SelectButtonModule } from 'primeng/selectbutton';
import { PasswordModule } from 'primeng/password';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserRole } from '../../../models/user.model';
import { ApiService } from '../../../services/api.service';
import { APP_DIALOG_BREAKPOINTS, APP_DIALOG_STYLE } from '../../../utils/dialog-mobile.util';
import { catchError, finalize, of } from 'rxjs';
import { EmptyStateComponent } from '../../../components/shared/empty-state.component';
import { ListSkeletonComponent } from '../../../components/shared/list-skeleton.component';

interface PlatformCompany {
  id: number;
  name: string;
  logoUrl?: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  roleCode: string;
  roleLabel: string;
  status: string;
  companyId: number | null;
  companyName: string | null;
  lastLogin: string | null;
  createdAt: string;
}

interface PageResponse {
  content: User[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

type StatusFilter = 'ALL' | 'Actif' | 'Inactif' | 'Suspendu';

@Component({
  selector: 'app-platform-users',
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
    SelectButtonModule,
    PasswordModule,
    PaginatorModule,
    EmptyStateComponent,
    ListSkeletonComponent
  ],
  templateUrl: './platform-users.component.html',
  styleUrl: './platform-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformUsersComponent implements OnInit {
  users: User[] = [];
  selectedUsers: User[] = [];
  displayDialog = false;
  user: any = {};
  globalFilter = '';
  statusFilter: StatusFilter = 'ALL';
  statusFilterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Actif', value: 'Actif' },
    { label: 'Inactif', value: 'Inactif' },
    { label: 'Suspendu', value: 'Suspendu' }
  ];
  listLoading = true;
  listLoadError = false;
  readonly dialogStyle = APP_DIALOG_STYLE;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;
  roles = [
    { label: 'Administrateur Entreprise', value: UserRole.ADMIN_ENTREPRISE },
    { label: 'Gestionnaire', value: UserRole.GESTIONNAIRE }
  ];
  statuses = ['Actif', 'Inactif', 'Suspendu'];

  // Pagination
  totalRecords = 0;
  page = 0;
  size = 10;

  // Liste des entreprises pour le dropdown
  companies: PlatformCompany[] = [];

  constructor(
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadCompanies();
  }

  loadCompanies() {
    // Charger la première page des entreprises pour le dropdown
    this.apiService.get<any>(`/companies?page=0&size=1000`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des entreprises:', error);
          return of({ content: [] });
        }),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe(response => {
        this.companies = response.content || [];
      });
  }

  loadUsers() {
    const search = this.globalFilter && this.globalFilter.trim() ? this.globalFilter.trim() : undefined;
    const status = this.statusFilter === 'ALL' ? undefined : this.statusFilter;
    const params = new URLSearchParams({
      page: String(this.page),
      size: String(this.size)
    });
    if (search) {
      params.set('search', search);
    }
    if (status) {
      params.set('status', status);
    }
    this.listLoading = true;
    this.listLoadError = false;
    this.cdr.markForCheck();

    this.apiService.get<PageResponse>(`/users?${params.toString()}`)
      .pipe(finalize(() => {
        this.listLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.users = response.content;
          this.totalRecords = response.totalElements;
        },
        error: (error) => {
          this.listLoadError = true;
          this.users = [];
          this.totalRecords = 0;
          console.error('Erreur lors du chargement des utilisateurs:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les utilisateurs'
          });
        }
      });
  }

  get hasActiveFilters(): boolean {
    return !!this.globalFilter?.trim() || this.statusFilter !== 'ALL';
  }

  resetFilters(): void {
    this.globalFilter = '';
    this.statusFilter = 'ALL';
    this.page = 0;
    this.loadUsers();
  }

  onStatusFilterChange(): void {
    this.page = 0;
    this.loadUsers();
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
    this.loadUsers();
  }

  onGlobalFilter() {
    this.page = 0; // Réinitialiser à la première page lors de la recherche
    this.loadUsers();
  }

  getSeverity(status: string): 'success' | 'danger' | 'warn' | undefined {
    switch (status) {
      case 'Actif':
        return 'success';
      case 'Inactif':
        return 'danger';
      case 'Suspendu':
        return 'warn';
      default:
        return undefined;
    }
  }

  getRoleLabel(roleCode: string): string {
    const user = this.users.find(u => u.roleCode === roleCode);
    return user?.roleLabel || roleCode;
  }

  getCompanyLogoUrl(companyId: number | null, companyName?: string | null): string | null {
    if (companyId != null) {
      const byId = this.companies.find((c) => c.id === companyId);
      if (byId?.logoUrl) {
        return byId.logoUrl;
      }
    }
    if (companyName) {
      const byName = this.companies.find((c) => c.name === companyName);
      if (byName?.logoUrl) {
        return byName.logoUrl;
      }
    }
    return null;
  }

  getSelectedCompanyLogoUrl(): string | null {
    return this.getCompanyLogoUrl(null, this.user?.entreprise);
  }

  onCompanySelectionChange(): void {
    this.cdr.markForCheck();
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return date;
    }
  }

  openNew() {
    this.user = {
      role: UserRole.GESTIONNAIRE,
      status: 'Actif'
    };
    this.displayDialog = true;
    this.cdr.markForCheck();
  }

  editUser(user: User) {
    this.user = {
      ...user,
      entreprise: user.companyName || '',
      role: user.roleCode as UserRole,
      status: user.status || 'Actif'
    };
    this.displayDialog = true;
    this.cdr.markForCheck();
  }

  saveUser() {
    if (!this.user.id) {
      // Création d'un nouvel utilisateur (non implémenté pour l'instant)
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: 'La création d\'utilisateur sera implémentée prochainement'
      });
      return;
    }

    // Trouver l'entreprise sélectionnée
    const selectedCompany = this.companies.find(c => c.name === this.user.entreprise);
    if (!selectedCompany) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Veuillez sélectionner une entreprise'
      });
      return;
    }

    const updateRequest = {
      name: this.user.name,
      email: this.user.email,
      roleCode: this.user.role,
      status: this.user.status,
      companyId: selectedCompany.id
    };

    this.apiService.put<any>(`/users/${this.user.id}`, updateRequest)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la mise à jour:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error.error?.message || 'Impossible de mettre à jour l\'utilisateur'
          });
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Utilisateur mis à jour avec succès'
          });
          this.displayDialog = false;
          this.loadUsers();
        }
        this.cdr.markForCheck();
      });
  }

  deleteUser(user: User) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ? Cette action est irréversible.`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Non, annuler',
      accept: () => {
        this.apiService.delete<any>(`/users/${user.id}`)
          .pipe(
            catchError(error => {
              console.error('Erreur lors de la suppression:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: error.error?.message || 'Impossible de supprimer l\'utilisateur'
              });
              return of(null);
            })
          )
          .subscribe(response => {
            if (response) {
              this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: 'Utilisateur supprimé avec succès'
              });
              this.loadUsers(); // Recharger la liste
            }
          });
      }
    });
  }

  toggleUserStatus(user: User) {
    const newStatus = user.status === 'Actif' ? 'Inactif' : 'Actif';
    const action = newStatus === 'Actif' ? 'activer' : 'désactiver';
    
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir ${action} l'utilisateur "${user.name}" ?`,
      header: `Confirmer ${newStatus === 'Actif' ? 'l\'activation' : 'la désactivation'}`,
      icon: 'pi pi-question-circle',
      acceptLabel: `Oui, ${action}`,
      rejectLabel: 'Non, annuler',
      accept: () => {
        const updateStatusRequest = { status: newStatus };
        this.apiService.patch<any>(`/users/${user.id}/status`, updateStatusRequest)
          .pipe(
            catchError(error => {
              console.error('Erreur lors du changement de statut:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: error.error?.message || 'Impossible de modifier le statut'
              });
              return of(null);
            })
          )
          .subscribe(response => {
            if (response) {
              this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: `Utilisateur ${newStatus === 'Actif' ? 'activé' : 'désactivé'} avec succès`
              });
              this.loadUsers(); // Recharger la liste
            }
          });
      }
    });
  }

  trackByUserId(_index: number, user: { id?: number }): number {
    return user.id ?? _index;
  }
}

