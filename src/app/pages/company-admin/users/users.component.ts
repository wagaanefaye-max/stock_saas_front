import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { DropdownModule } from 'primeng/dropdown';
import { PasswordModule } from 'primeng/password';
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { Menu } from 'primeng/menu';
import { ViewChild } from '@angular/core';
import { UserRole, AuthService } from '../../../services/auth.service';

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
    DropdownModule,
    PasswordModule,
    MenuModule,
    MultiSelectModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class CompanyUsersComponent {
  users = [
    { id: 1, name: 'Marie Martin', email: 'marie.martin@entreprise.com', role: UserRole.GESTIONNAIRE, status: 'Actif', lastLogin: '2024-01-14', assignedWarehouses: [1, 2] },
    { id: 2, name: 'Sophie Bernard', email: 'sophie.bernard@entreprise.com', role: UserRole.UTILISATEUR, status: 'Actif', lastLogin: '2024-01-15', assignedWarehouses: [1] },
    { id: 3, name: 'Paul Durand', email: 'paul.durand@entreprise.com', role: UserRole.UTILISATEUR, status: 'Inactif', lastLogin: '2024-01-10', assignedWarehouses: [3] },
    { id: 4, name: 'Lucie Moreau', email: 'lucie.moreau@entreprise.com', role: UserRole.GESTIONNAIRE, status: 'Actif', lastLogin: '2024-01-15', assignedWarehouses: [2, 3] }
  ];

  selectedUsers: any[] = [];
  displayDialog = false;
  user: any = {};
  globalFilter = '';
  menuItems: any[] = [];
  selectedUser: any = null;
  @ViewChild('actionMenu') actionMenu!: Menu;

  roles = [
    { label: 'Gestionnaire', value: UserRole.GESTIONNAIRE },
    { label: 'Utilisateur', value: UserRole.UTILISATEUR }
  ];
  statuses = ['Actif', 'Inactif', 'Suspendu'];
  
  // Liste des entrepôts disponibles (à récupérer depuis l'API)
  warehouses = [
    { id: 1, name: 'Entrepôt Central' },
    { id: 2, name: 'Entrepôt Nord' },
    { id: 3, name: 'Entrepôt Sud' },
    { id: 4, name: 'Entrepôt Est' }
  ];

  constructor(public authService: AuthService) {}

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

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.GESTIONNAIRE:
        return 'Gestionnaire';
      case UserRole.UTILISATEUR:
        return 'Utilisateur';
      default:
        return role;
    }
  }

  getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | undefined {
    switch (role) {
      case UserRole.GESTIONNAIRE:
        return 'info';
      case UserRole.UTILISATEUR:
        return 'warn';
      default:
        return undefined;
    }
  }

  openNew() {
    this.user = {
      role: UserRole.UTILISATEUR,
      status: 'Actif',
      assignedWarehouses: []
    };
    this.displayDialog = true;
  }

  editUser(user: any) {
    this.user = { 
      ...user,
      assignedWarehouses: user.assignedWarehouses ? [...user.assignedWarehouses] : []
    };
    this.displayDialog = true;
  }

  saveUser() {
    if (!this.user.name || !this.user.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.user.id) {
      const index = this.users.findIndex(u => u.id === this.user.id);
      if (index !== -1) {
        this.users[index] = { ...this.user };
      }
    } else {
      if (!this.user.password) {
        alert('Le mot de passe est requis pour un nouvel utilisateur');
        return;
      }
      this.user.id = this.users.length + 1;
      this.user.lastLogin = '-';
      this.users.push({ ...this.user });
    }
    this.displayDialog = false;
    this.user = {};
  }

  deleteUser(user: any) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ?`)) {
      const index = this.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        this.users.splice(index, 1);
      }
    }
  }

  toggleUserStatus(user: any) {
    const newStatus = user.status === 'Actif' ? 'Inactif' : 'Actif';
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index].status = newStatus;
    }
  }

  showMenu(event: Event, user: any) {
    this.selectedUser = user;
    this.menuItems = [
      {
        label: 'Modifier',
        icon: 'pi pi-pencil',
        command: () => {
          this.editUser(user);
        }
      },
      {
        label: user.status === 'Actif' ? 'Désactiver' : 'Activer',
        icon: user.status === 'Actif' ? 'pi pi-ban' : 'pi pi-check-circle',
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

  isFormValid(): boolean {
    const baseValid = !!(this.user.name && this.user.email && this.user.role);
    if (this.user.id) {
      return baseValid;
    } else {
      return baseValid && !!this.user.password;
    }
  }

  getWarehouseName(warehouseId: number): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : `Entrepôt ${warehouseId}`;
  }
}
