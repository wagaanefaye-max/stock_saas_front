import { Component } from '@angular/core';
import { AppShellComponent } from '../app-shell/app-shell.component';
import { SUPER_ADMIN_NAV_CONFIG } from '../app-shell/app-nav.config';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell [config]="navConfig" />`
})
export class SuperAdminLayoutComponent {
  readonly navConfig = SUPER_ADMIN_NAV_CONFIG;
}
