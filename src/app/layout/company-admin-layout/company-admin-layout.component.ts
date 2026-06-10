import { Component } from '@angular/core';
import { AppShellComponent } from '../app-shell/app-shell.component';
import { COMPANY_ADMIN_NAV_CONFIG } from '../app-shell/app-nav.config';

@Component({
  selector: 'app-company-admin-layout',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell [config]="navConfig" />`
})
export class CompanyAdminLayoutComponent {
  readonly navConfig = COMPANY_ADMIN_NAV_CONFIG;
}
