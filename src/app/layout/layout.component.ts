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
import { AuthService, UserRole } from '../services/auth.service';

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
  UserRole = UserRole;

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    // Menu pour utilisateurs normaux (Gestionnaire et Utilisateur)
    this.menuItems = [
      {
        label: 'Tableau de bord',
        icon: 'pi pi-th-large',
        mobileIcon: 'pi pi-th-large',
        routerLink: '/gestion/dashboard',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Produits',
        icon: 'pi pi-shopping-bag',
        mobileIcon: 'pi pi-shopping-bag',
        routerLink: '/gestion/products',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Entrepôts',
        icon: 'pi pi-warehouse',
        mobileIcon: 'pi pi-warehouse',
        routerLink: '/gestion/warehouses',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Mouvements',
        icon: 'pi pi-sync',
        mobileIcon: 'pi pi-sync',
        routerLink: '/gestion/movements',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Rapports',
        icon: 'pi pi-file-pdf',
        mobileIcon: 'pi pi-file-pdf',
        routerLink: '/gestion/reports',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Paramètres',
        icon: 'pi pi-sliders-h',
        mobileIcon: 'pi pi-sliders-h',
        routerLink: '/gestion/settings',
        command: () => this.sidebarVisible = false
      }
    ];
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}

