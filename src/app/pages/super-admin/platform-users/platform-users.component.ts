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
import { UserRole } from '../../../services/auth.service';

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
    DropdownModule,
    PasswordModule
  ],
  templateUrl: './platform-users.component.html',
  styleUrl: './platform-users.component.scss'
})
export class PlatformUsersComponent {
  users = [
    { id: 1, name: 'Jean Dupont', email: 'jean.dupont@entreprise1.com', entreprise: 'Entreprise A', role: UserRole.ADMIN_ENTREPRISE, status: 'Actif', lastLogin: '2024-01-15' },
    { id: 2, name: 'Marie Martin', email: 'marie.martin@entreprise1.com', entreprise: 'Entreprise A', role: UserRole.GESTIONNAIRE, status: 'Actif', lastLogin: '2024-01-14' },
    { id: 3, name: 'Pierre Durand', email: 'pierre.durand@entreprise2.com', entreprise: 'Entreprise B', role: UserRole.ADMIN_ENTREPRISE, status: 'Actif', lastLogin: '2024-01-15' },
    { id: 4, name: 'Sophie Bernard', email: 'sophie.bernard@entreprise2.com', entreprise: 'Entreprise B', role: UserRole.UTILISATEUR, status: 'Inactif', lastLogin: '2024-01-10' }
  ];

  selectedUsers: any[] = [];
  displayDialog = false;
  user: any = {};
  globalFilter = '';
  roles = [
    { label: 'Administrateur Entreprise', value: UserRole.ADMIN_ENTREPRISE },
    { label: 'Gestionnaire', value: UserRole.GESTIONNAIRE },
    { label: 'Utilisateur', value: UserRole.UTILISATEUR }
  ];
  statuses = ['Actif', 'Inactif', 'Suspendu'];
  entreprises = ['Entreprise A', 'Entreprise B', 'Entreprise C'];

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
      case UserRole.ADMIN_ENTREPRISE:
        return 'Admin Entreprise';
      case UserRole.GESTIONNAIRE:
        return 'Gestionnaire';
      case UserRole.UTILISATEUR:
        return 'Utilisateur';
      default:
        return role;
    }
  }

  openNew() {
    this.user = {
      role: UserRole.UTILISATEUR,
      status: 'Actif'
    };
    this.displayDialog = true;
  }

  editUser(user: any) {
    this.user = { ...user };
    this.displayDialog = true;
  }

  saveUser() {
    if (this.user.id) {
      const index = this.users.findIndex(u => u.id === this.user.id);
      if (index !== -1) {
        this.users[index] = { ...this.user };
      }
    } else {
      this.user.id = this.users.length + 1;
      this.user.lastLogin = '-';
      this.users.push({ ...this.user });
    }
    this.displayDialog = false;
  }

  deleteUser(user: any) {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
}

