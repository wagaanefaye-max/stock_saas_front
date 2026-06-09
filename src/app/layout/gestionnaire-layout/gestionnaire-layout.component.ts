import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarModule } from 'primeng/sidebar';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-gestionnaire-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarModule],
  templateUrl: './gestionnaire-layout.component.html',
  styleUrl: './gestionnaire-layout.component.scss'
})
export class GestionnaireLayoutComponent implements OnInit {
  menuItems: MenuItem[] = [];
  bottomNavItems: MenuItem[] = [];
  moreMenuItems: MenuItem[] = [];
  mobileMenuOpen = false;

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    this.menuItems = [
      { label: 'Accueil', mobileLabel: 'Accueil', icon: 'pi pi-th-large', routerLink: '/gestionnaire/dashboard' },
      { label: 'Produits', mobileLabel: 'Produits', icon: 'pi pi-shopping-bag', routerLink: '/gestionnaire/products' },
      { label: 'Entrepôts', mobileLabel: 'Dépôts', icon: 'pi pi-warehouse', routerLink: '/gestionnaire/warehouses' },
      { label: 'Mouvements', mobileLabel: 'Mvts', icon: 'pi pi-sync', routerLink: '/gestionnaire/movements' },
      { label: 'Inventaires', mobileLabel: 'Invent.', icon: 'pi pi-clipboard', routerLink: '/gestionnaire/inventories' },
      { label: 'Paramètres', mobileLabel: 'Réglages', icon: 'pi pi-sliders-h', routerLink: '/gestionnaire/settings' }
    ];
    this.bottomNavItems = [
      this.menuItems[0],
      this.menuItems[1],
      this.menuItems[3],
      this.menuItems[4]
    ];
    this.moreMenuItems = [this.menuItems[2], this.menuItems[5]];
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  logout() {
    this.authService.confirmLogout(() => this.closeMobileMenu());
  }
}
