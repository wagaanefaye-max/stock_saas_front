import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarModule,
    ButtonModule,
    MenuModule,
    AvatarModule,
    MenubarModule,
    BadgeModule,
    DividerModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  sidebarVisible = false;
  menuItems: MenuItem[] = [];

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    const isSuperAdmin = this.authService.isSuperAdmin();

    if (isSuperAdmin) {
      // Menu pour Super Admin
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
          label: 'Utilisateurs système',
          icon: 'pi pi-users',
          routerLink: '/super-admin/system-users',
          command: () => this.sidebarVisible = false
        }
      ];
    } else {
      // Menu pour utilisateurs normaux
    this.menuItems = [
      {
        label: 'Tableau de bord',
        icon: 'pi pi-home',
        routerLink: '/dashboard',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Produits',
        icon: 'pi pi-box',
        routerLink: '/products',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Entrepôts',
        icon: 'pi pi-building',
        routerLink: '/warehouses',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Mouvements',
        icon: 'pi pi-arrows-h',
        routerLink: '/movements',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Rapports',
        icon: 'pi pi-chart-bar',
        routerLink: '/reports',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Paramètres',
        icon: 'pi pi-cog',
        routerLink: '/settings',
        command: () => this.sidebarVisible = false
      }
    ];
    }
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}

