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
import { PasswordModule } from 'primeng/password';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UserRole } from '../../../models/user.model';
import { ApiService } from '../../../services/api.service';
import { catchError, of } from 'rxjs';

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
    PasswordModule,
    MenuModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './platform-users.component.html',
  styleUrl: './platform-users.component.scss'
})
export class PlatformUsersComponent implements OnInit {
  users: User[] = [];
  selectedUsers: User[] = [];
  displayDialog = false;
  user: any = {};
  globalFilter = '';
  roles = [
    { label: 'Administrateur Entreprise', value: UserRole.ADMIN_ENTREPRISE },
    { label: 'Gestionnaire', value: UserRole.GESTIONNAIRE }
  ];
  statuses = ['Actif', 'Inactif', 'Suspendu'];

  // Pagination
  totalRecords = 0;
  page = 0;
  size = 10;

  // Menu contextuel
  menuItems: any[] = [];
  selectedUser: User | null = null;
  @ViewChild('actionMenu') actionMenu!: Menu;

  // Liste des entreprises pour le dropdown
  companies: any[] = [];

  constructor(
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
        })
      )
      .subscribe(response => {
        this.companies = response.content || [];
      });
  }

  loadUsers() {
    const search = this.globalFilter && this.globalFilter.trim() ? this.globalFilter.trim() : undefined;
    
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
        this.users = response.content;
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
  }

  editUser(user: User) {
    this.user = { 
      ...user,
      entreprise: user.companyName || '',
      role: user.roleCode as UserRole,
      status: user.status || 'Actif'
    };
    this.displayDialog = true;
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
          this.loadUsers(); // Recharger la liste
        }
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
}

