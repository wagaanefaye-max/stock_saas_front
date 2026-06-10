import { Component } from '@angular/core';
import { AppShellComponent } from '../app-shell/app-shell.component';
import { GESTIONNAIRE_NAV_CONFIG } from '../app-shell/app-nav.config';

@Component({
  selector: 'app-gestionnaire-layout',
  standalone: true,
  imports: [AppShellComponent],
  template: `<app-shell [config]="navConfig" />`
})
export class GestionnaireLayoutComponent {
  readonly navConfig = GESTIONNAIRE_NAV_CONFIG;
}
