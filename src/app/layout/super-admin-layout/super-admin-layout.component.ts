import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarModule,
    ButtonModule,
    MenuModule,
    AvatarModule,
    BadgeModule,
    DividerModule
  ],
  templateUrl: './super-admin-layout.component.html',
  styleUrl: './super-admin-layout.component.scss'
})
export class SuperAdminLayoutComponent implements OnInit {
  sidebarVisible = false;
  menuItems: MenuItem[] = [];

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    this.menuItems = [
      {
        label: 'Tableau de bord',
        icon: 'pi pi-home',
        routerLink: '/super-admin/dashboard',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Entreprises',
        icon: 'pi pi-building',
        routerLink: '/super-admin/companies',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Utilisateurs plateforme',
        icon: 'pi pi-users',
        routerLink: '/super-admin/platform-users',
        command: () => this.sidebarVisible = false
      },
      // {
      //   label: 'Utilisateurs système',
      //   icon: 'pi pi-user-edit',
      //   routerLink: '/super-admin/system-users',
      //   command: () => this.sidebarVisible = false
      // },
      {
        label: 'Paramètres plateforme',
        icon: 'pi pi-cog',
        routerLink: '/super-admin/platform-settings',
        command: () => this.sidebarVisible = false
      }
    ];
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}

