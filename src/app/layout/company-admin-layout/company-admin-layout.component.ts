import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarModule } from 'primeng/sidebar';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-company-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarModule],
  templateUrl: './company-admin-layout.component.html',
  styleUrl: './company-admin-layout.component.scss'
})
export class CompanyAdminLayoutComponent implements OnInit {
  menuItems: MenuItem[] = [];
  bottomNavItems: MenuItem[] = [];
  moreMenuItems: MenuItem[] = [];
  mobileMenuOpen = false;

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    this.menuItems = [
      { label: 'Accueil', mobileLabel: 'Accueil', icon: 'pi pi-home', routerLink: '/company-admin/dashboard' },
      { label: 'Factures', mobileLabel: 'Factures', icon: 'pi pi-file-edit', routerLink: '/company-admin/invoices' },
      { label: 'Stock', mobileLabel: 'Stock', icon: 'pi pi-box', routerLink: '/company-admin/products' },
      { label: 'Partenaires', mobileLabel: 'Partenaires', icon: 'pi pi-users', routerLink: '/company-admin/partners' },
      { label: 'Entrepôts', mobileLabel: 'Entrepôts', icon: 'pi pi-warehouse', routerLink: '/company-admin/warehouses' },
      { label: 'Mouvements', mobileLabel: 'Mouvements', icon: 'pi pi-sync', routerLink: '/company-admin/movements' },
      { label: 'Inventaires', mobileLabel: 'Inventaires', icon: 'pi pi-clipboard', routerLink: '/company-admin/inventories' },
      { label: 'Abonnement', mobileLabel: 'Offre', icon: 'pi pi-credit-card', routerLink: '/company-admin/subscriptions' },
      { label: 'Paramètres', mobileLabel: 'Réglages', icon: 'pi pi-cog', routerLink: '/company-admin/settings' }
    ];
    this.bottomNavItems = [
      this.menuItems[0],
      this.menuItems[1],
      this.menuItems[2],
      this.menuItems[7]
    ];
    this.moreMenuItems = [
      this.menuItems[3],
      this.menuItems[4],
      this.menuItems[5],
      this.menuItems[6],
      this.menuItems[8]
    ];
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  logout() {
    this.authService.confirmLogout(() => this.closeMobileMenu());
  }
}
