import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarModule } from 'primeng/sidebar';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarModule],
  templateUrl: './super-admin-layout.component.html',
  styleUrl: './super-admin-layout.component.scss'
})
export class SuperAdminLayoutComponent implements OnInit {
  menuItems: MenuItem[] = [];
  bottomNavItems: MenuItem[] = [];
  moreMenuItems: MenuItem[] = [];
  mobileMenuOpen = false;

  constructor(public router: Router, public authService: AuthService) {}

  ngOnInit() {
    this.menuItems = [
      { label: 'Accueil', icon: 'pi pi-th-large', routerLink: '/super-admin/dashboard' },
      { label: 'Entreprises', icon: 'pi pi-briefcase', routerLink: '/super-admin/companies' },
      { label: 'Souscriptions', icon: 'pi pi-credit-card', routerLink: '/super-admin/subscription-requests' },
      { label: 'Utilisateurs', icon: 'pi pi-user', routerLink: '/super-admin/platform-users' },
      { label: 'Paramètres', icon: 'pi pi-sliders-h', routerLink: '/super-admin/platform-settings' }
    ];
    this.bottomNavItems = [this.menuItems[0], this.menuItems[1], this.menuItems[2]];
    this.moreMenuItems = [this.menuItems[3], this.menuItems[4]];
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
