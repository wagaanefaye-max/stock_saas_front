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
  selector: 'app-gestionnaire-layout',
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
  templateUrl: './gestionnaire-layout.component.html',
  styleUrl: './gestionnaire-layout.component.scss'
})
export class GestionnaireLayoutComponent implements OnInit {
  sidebarVisible = false;
  menuItems: MenuItem[] = [];

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    this.menuItems = [
      {
        label: 'Tableau de bord',
        icon: 'pi pi-th-large',
        mobileIcon: 'pi pi-th-large',
        routerLink: '/gestionnaire/dashboard',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Produits',
        icon: 'pi pi-shopping-bag',
        mobileIcon: 'pi pi-shopping-bag',
        routerLink: '/gestionnaire/products',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Entrepôts',
        icon: 'pi pi-warehouse',
        mobileIcon: 'pi pi-warehouse',
        routerLink: '/gestionnaire/warehouses',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Mouvements',
        icon: 'pi pi-sync',
        mobileIcon: 'pi pi-sync',
        routerLink: '/gestionnaire/movements',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Rapports',
        icon: 'pi pi-file-pdf',
        mobileIcon: 'pi pi-file-pdf',
        routerLink: '/gestionnaire/reports',
        command: () => this.sidebarVisible = false
      },
      {
        label: 'Paramètres',
        icon: 'pi pi-sliders-h',
        mobileIcon: 'pi pi-sliders-h',
        routerLink: '/gestionnaire/settings',
        command: () => this.sidebarVisible = false
      }
    ];
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}

