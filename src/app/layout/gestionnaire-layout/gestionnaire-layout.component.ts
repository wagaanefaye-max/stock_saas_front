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
      { label: 'Accueil', icon: 'pi pi-th-large', routerLink: '/gestionnaire/dashboard' },
      { label: 'Produits', icon: 'pi pi-shopping-bag', routerLink: '/gestionnaire/products' },
      { label: 'Entrepôts', icon: 'pi pi-warehouse', routerLink: '/gestionnaire/warehouses' },
      { label: 'Mouvements', icon: 'pi pi-sync', routerLink: '/gestionnaire/movements' },
      { label: 'Inventaires', icon: 'pi pi-clipboard', routerLink: '/gestionnaire/inventories' },
      { label: 'Paramètres', icon: 'pi pi-sliders-h', routerLink: '/gestionnaire/settings' }
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
