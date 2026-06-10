import { Component } from '@angular/core';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  template: `
    <div class="global-loading" role="status" aria-live="polite" aria-label="Chargement en cours">
      <div class="global-loading__backdrop"></div>
      <div class="global-loading__panel">
        <div class="global-loading__spinner" aria-hidden="true">
          <span class="global-loading__ring global-loading__ring--outer"></span>
          <span class="global-loading__ring global-loading__ring--inner"></span>
          <img src="/assets/logo.jpg" alt="" class="global-loading__logo" />
        </div>
      </div>
    </div>
  `
})
export class GlobalLoadingComponent {}
