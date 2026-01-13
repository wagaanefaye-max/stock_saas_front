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
  selector: 'app-system-users',
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
  templateUrl: './system-users.component.html',
  styleUrl: './system-users.component.scss'
})
export class SystemUsersComponent {
  users = [
    { id: 1, name: 'Admin Système 1', email: 'admin1@platform.com', role: UserRole.SUPER_ADMIN, status: 'Actif', lastLogin: '2024-01-15' },
    { id: 2, name: 'Admin Système 2', email: 'admin2@platform.com', role: UserRole.SUPER_ADMIN, status: 'Actif', lastLogin: '2024-01-14' },
    { id: 3, name: 'Support Tech', email: 'support@platform.com', role: UserRole.SUPER_ADMIN, status: 'Actif', lastLogin: '2024-01-15' }
  ];

  selectedUsers: any[] = [];
  displayDialog = false;
  user: any = {};
  globalFilter = '';
  roles = [
    { label: 'Super Administrateur', value: UserRole.SUPER_ADMIN }
  ];
  statuses = ['Actif', 'Inactif'];

  getSeverity(status: string): 'success' | 'danger' | undefined {
    return status === 'Actif' ? 'success' : 'danger';
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      default:
        return role;
    }
  }

  openNew() {
    this.user = {
      role: UserRole.SUPER_ADMIN,
      status: 'Actif'
    };
    this.displayDialog = true;
  }

  editUser(user: any) {
    this.user = { ...user };
    this.displayDialog = true;
  }

  saveUser() {
    // TODO: Implémenter la sauvegarde
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
    // TODO: Implémenter la suppression
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
}

