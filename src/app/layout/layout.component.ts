import { Component } from '@angular/core';
import { AppShellComponent } from './app-shell/app-shell.component';
import { GESTION_NAV_CONFIG } from './app-shell/app-nav.config';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell [config]="navConfig" />`
})
export class LayoutComponent {
  readonly navConfig = GESTION_NAV_CONFIG;
}
