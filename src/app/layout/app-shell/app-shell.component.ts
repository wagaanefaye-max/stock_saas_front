import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarModule } from 'primeng/sidebar';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SuperAdminSubscriptionBadgeService } from '../../services/super-admin-subscription-badge.service';
import { AppNavItem, AppShellConfig } from './app-nav.config';

const SIDEBAR_COLLAPSED_KEY = 'stock-saas-sidebar-collapsed';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent implements OnInit, OnDestroy {
  @Input({ required: true }) config!: AppShellConfig;

  @ViewChild('commandInput') commandInput?: ElementRef<HTMLInputElement>;

  sidebarCollapsed = false;
  profileMenuOpen = false;
  mobileMenuOpen = false;
  mobileMenuQuery = '';
  commandPaletteOpen = false;
  commandQuery = '';
  commandActiveIndex = 0;
  pendingSubscriptions = 0;

  private badgeSub?: Subscription;
  private readonly onDocumentClick = () => {
    this.profileMenuOpen = false;
  };

  constructor(
    public authService: AuthService,
    private router: Router,
    private subscriptionBadgeService: SuperAdminSubscriptionBadgeService
  ) {}

  ngOnInit() {
    this.sidebarCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    document.addEventListener('click', this.onDocumentClick);
    if (this.config.layoutClass === 'super-admin-layout') {
      this.badgeSub = this.subscriptionBadgeService.pendingCount$.subscribe(
        (count) => (this.pendingSubscriptions = count)
      );
      this.subscriptionBadgeService.startPolling();
    }
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick);
    this.subscriptionBadgeService.stopPolling();
    this.badgeSub?.unsubscribe();
  }

  getNavBadge(navItem: AppNavItem): number {
    if (navItem.badgeKey === 'pendingSubscriptions') {
      return this.pendingSubscriptions;
    }
    return 0;
  }

  formatNavBadge(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  get commandShortcutLabel(): string {
    return typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
      ? '⌘K'
      : 'Ctrl+K';
  }

  get bottomNavItems(): AppNavItem[] {
    const primary = this.config.items.filter((i) => i.mobilePrimary);
    const fallback = primary.length > 0 ? primary : this.config.items;
    // Réserver une place pour le bouton Menu (déconnexion + pages restantes)
    return fallback.slice(0, 4);
  }

  get secondaryMobileItems(): AppNavItem[] {
    const primaryLinks = new Set(this.bottomNavItems.map((i) => i.routerLink));
    return this.config.items.filter((i) => !primaryLinks.has(i.routerLink));
  }

  get filteredMobileMenuItems(): AppNavItem[] {
    return this.filterItems(this.config.items, this.mobileMenuQuery);
  }

  get filteredCommandItems(): AppNavItem[] {
    return this.filterItems(this.config.items, this.commandQuery);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, this.sidebarCollapsed ? '1' : '0');
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  openMobileMenu() {
    this.mobileMenuOpen = true;
    this.mobileMenuQuery = '';
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.mobileMenuQuery = '';
  }

  openCommandPalette() {
    this.commandPaletteOpen = true;
    this.commandQuery = '';
    this.commandActiveIndex = 0;
    setTimeout(() => this.commandInput?.nativeElement?.focus(), 0);
  }

  closeCommandPalette() {
    this.commandPaletteOpen = false;
    this.commandQuery = '';
    this.commandActiveIndex = 0;
  }

  navigateFromCommand(navItem: AppNavItem) {
    this.router.navigate([navItem.routerLink], {
      queryParams: navItem.queryParams || undefined
    });
    this.closeCommandPalette();
    this.closeMobileMenu();
  }

  onCommandKeydown(event: KeyboardEvent) {
    const items = this.filteredCommandItems;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCommandPalette();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.commandActiveIndex = Math.min(this.commandActiveIndex + 1, Math.max(items.length - 1, 0));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.commandActiveIndex = Math.max(this.commandActiveIndex - 1, 0);
      return;
    }
    if (event.key === 'Enter' && items.length > 0) {
      event.preventDefault();
      this.navigateFromCommand(items[this.commandActiveIndex]);
    }
  }

  logout() {
    this.profileMenuOpen = false;
    this.authService.confirmLogout(() => this.closeMobileMenu());
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.commandPaletteOpen) {
        this.closeCommandPalette();
      } else {
        this.openCommandPalette();
      }
    }
  }

  private filterItems(items: AppNavItem[], query: string): AppNavItem[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((item) => {
      const haystack = [
        item.label,
        item.mobileLabel,
        item.routerLink,
        ...(item.searchTerms ?? [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }
}
