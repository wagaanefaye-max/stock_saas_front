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
  selector: 'app-company-admin-layout',
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
  templateUrl: './company-admin-layout.component.html',
  styleUrl: './company-admin-layout.component.scss'
})
export class CompanyAdminLayoutComponent implements OnInit {
  sidebarVisible = false;
  menuItems: MenuItem[] = [];

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    this.menuItems = [
      {
        label: 'Tableau de bord',
        icon: 'pi pi-th-large',
        mobileIcon: 'pi pi-th-large',
        routerLink: '/company-admin/dashboard',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Utilisateurs',
        icon: 'pi pi-users',
        mobileIcon: 'pi pi-users',
        routerLink: '/company-admin/users',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Produits',
        icon: 'pi pi-shopping-bag',
        mobileIcon: 'pi pi-shopping-bag',
        routerLink: '/company-admin/products',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Entrepôts',
        icon: 'pi pi-warehouse',
        mobileIcon: 'pi pi-warehouse',
        routerLink: '/company-admin/warehouses',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Mouvements',
        icon: 'pi pi-sync',
        mobileIcon: 'pi pi-sync',
        routerLink: '/company-admin/movements',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Rapports',
        icon: 'pi pi-file-pdf',
        mobileIcon: 'pi pi-file-pdf',
        routerLink: '/company-admin/reports',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Paramètres',
        icon: 'pi pi-sliders-h',
        mobileIcon: 'pi pi-sliders-h',
        routerLink: '/company-admin/settings',
        command: () => this.sidebarVisible = false
      }
    ];
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
