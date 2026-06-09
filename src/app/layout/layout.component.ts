import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarModule } from 'primeng/sidebar';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  menuItems: MenuItem[] = [];
  bottomNavItems: MenuItem[] = [];
  moreMenuItems: MenuItem[] = [];
  mobileMenuOpen = false;
  UserRole = UserRole;

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    this.menuItems = [
      { label: 'Accueil', mobileLabel: 'Accueil', icon: 'pi pi-th-large', routerLink: '/gestion/dashboard' },
      { label: 'Produits', mobileLabel: 'Produits', icon: 'pi pi-shopping-bag', routerLink: '/gestion/products' },
      { label: 'Entrepôts', mobileLabel: 'Dépôts', icon: 'pi pi-warehouse', routerLink: '/gestion/warehouses' },
      { label: 'Mouvements', mobileLabel: 'Mvts', icon: 'pi pi-sync', routerLink: '/gestion/movements' },
      { label: 'Inventaires', mobileLabel: 'Invent.', icon: 'pi pi-clipboard', routerLink: '/gestion/inventories' },
      { label: 'Paramètres', mobileLabel: 'Réglages', icon: 'pi pi-sliders-h', routerLink: '/gestion/settings' }
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
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
