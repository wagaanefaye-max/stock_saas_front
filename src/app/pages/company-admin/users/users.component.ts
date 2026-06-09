import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MultiSelectModule } from 'primeng/multiselect';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Menu } from 'primeng/menu';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { UserRole } from '../../../models/user.model';
import { catchError, of, throwError } from 'rxjs';
import { ListSkeletonComponent } from '../../../components/shared/list-skeleton.component';

interface User {
  id: number;
  name: string;
  email: string;
  roleCode: string;
  roleLabel?: string;
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

@Component({
  selector: 'app-company-users',
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
    MultiSelectModule,
    MenuModule,
    ToastModule,
    TooltipModule,
    PaginatorModule,
    ProgressSpinnerModule,
    ListSkeletonComponent
  ],
  providers: [MessageService],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class CompanyUsersComponent implements OnInit {
  users: User[] = [];
  selectedUsers: User[] = [];
  loading = false;
  displayDialog = false;
  user: any = {};
  globalFilter = '';
  menuItems: any[] = [];
  selectedUser: User | null = null;
  @ViewChild('actionMenu') actionMenu!: Menu;

  roles = [
    { label: 'Gestionnaire', value: UserRole.GESTIONNAIRE }
  ];
  statuses = ['Actif', 'Inactif', 'Suspendu'];
  
  // Pagination
  totalRecords = 0;
  page = 0;
  size = 10;
  
  // Liste des entrepôts disponibles (à récupérer depuis l'API)
  warehouses = [
    { id: 1, name: 'Entrepôt Central' },
    { id: 2, name: 'Entrepôt Nord' },
    { id: 3, name: 'Entrepôt Sud' },
    { id: 4, name: 'Entrepôt Est' }
  ];

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    const search = this.globalFilter && this.globalFilter.trim() ? this.globalFilter.trim() : undefined;

    this.loading = true;
    // Filtrer uniquement les utilisateurs de l'entreprise de l'utilisateur connecté
    this.apiService.get<PageResponse>(`/users?page=${this.page}&size=${this.size}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des utilisateurs:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les utilisateurs'
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
      .subscribe(response => {
        this.users = response.content ?? [];
        this.totalRecords = response.totalElements ?? 0;
        this.loading = false;
      });
  }

  onPageChange(event: any) {
    if (event.first !== undefined && event.rows !== undefined) {
      // Événement de pagination lazy load PrimeNG
      this.page = Math.floor(event.first / event.rows);
      this.size = event.rows;
    } else if (event.page !== undefined) {
      // Événement personnalisé
      this.page = event.page;
      this.size = event.rows || event.size || 10;
    }
    this.loadUsers();
  }

  onGlobalFilter() {
    this.page = 0; // Réinitialiser à la première page lors de la recherche
    this.loadUsers();
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
    switch (roleCode) {
      case UserRole.GESTIONNAIRE:
        return 'Gestionnaire';
      default:
        return roleCode;
    }
  }

  getRoleSeverity(roleCode: string): 'success' | 'info' | 'warn' | undefined {
    switch (roleCode) {
      case UserRole.GESTIONNAIRE:
        return 'info';
      default:
        return undefined;
    }
  }

  openNew() {
    this.user = {
      roleCode: UserRole.GESTIONNAIRE,
      status: 'Actif',
      companyId: this.authService.getCurrentUser()?.companyId || null
    };
    this.displayDialog = true;
  }

  editUser(user: User) {
    this.apiService.get<User>(`/users/${user.id}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les détails de l\'utilisateur'
          });
          return of(null);
        })
      )
      .subscribe(fetchedUser => {
        if (fetchedUser) {
          this.user = { 
            ...fetchedUser,
            roleCode: fetchedUser.roleCode,
            companyId: fetchedUser.companyId || null
          };
          this.displayDialog = true;
        }
      });
  }

  saveUser() {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }

    if (!this.user.id) {
      // Création d'un nouvel utilisateur (non implémenté pour l'instant)
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: 'La création d\'utilisateur sera implémentée prochainement'
      });
      return;
    }

    const userRequest = {
      name: this.user.name,
      email: this.user.email,
      roleCode: this.user.roleCode,
      status: this.user.status,
      companyId: this.user.companyId
    };

    this.apiService.put<User>(`/users/${this.user.id}`, userRequest)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la modification de l\'utilisateur:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error.error?.message || 'Impossible de modifier l\'utilisateur'
          });
          return throwError(() => error);
        })
      )
      .subscribe(updatedUser => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `L'utilisateur "${updatedUser.name}" a été mis à jour.`
        });
        this.displayDialog = false;
        this.loadUsers(); // Reload data
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
        this.apiService.delete(`/users/${user.id}`)
          .pipe(
            catchError(error => {
              console.error('Erreur lors de la suppression de l\'utilisateur:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: error.error?.message || 'Impossible de supprimer l\'utilisateur'
              });
              return throwError(() => error);
            })
          )
          .subscribe(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: `L'utilisateur "${user.name}" a été supprimé.`
            });
            this.loadUsers(); // Reload data
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
        this.apiService.patch(`/users/${user.id}/status`, { status: newStatus })
          .pipe(
            catchError(error => {
              console.error('Erreur lors du changement de statut:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: error.error?.message || 'Impossible de changer le statut de l\'utilisateur'
              });
              return throwError(() => error);
            })
          )
          .subscribe(updatedUser => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: `Le statut de l'utilisateur "${user.name}" a été changé en "${newStatus}".`
            });
            this.loadUsers(); // Reload data
          });
      }
    });
  }

  showMenu(event: Event, user: User) {
    this.selectedUser = user;
    const isActive = user.status === 'Actif';
    this.menuItems = [
      {
        label: 'Modifier',
        icon: 'pi pi-pencil',
        command: () => {
          this.editUser(user);
        }
      },
      {
        label: isActive ? 'Désactiver' : 'Activer',
        icon: isActive ? 'pi pi-ban' : 'pi pi-check-circle',
        command: () => {
          this.toggleUserStatus(user);
        }
      },
      {
        separator: true
      },
      {
        label: 'Supprimer',
        icon: 'pi pi-trash',
        styleClass: 'text-red-500',
        command: () => {
          this.deleteUser(user);
        }
      }
    ];
    this.actionMenu.toggle(event);
  }

  /**
   * Récupère le nom d'un entrepôt par son ID
   */
  getWarehouseName(warehouseId: number): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : `Entrepôt ${warehouseId}`;
  }

  /**
   * Vérifie si le formulaire est valide
   */
  isFormValid(): boolean {
    if (!this.user.name || !this.user.email || !this.user.roleCode || !this.user.status) {
      return false;
    }
    
    // Vérifier que l'email est valide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email)) {
      return false;
    }
    
    return true;
  }
}
